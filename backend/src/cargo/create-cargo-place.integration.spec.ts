import { readFile } from 'node:fs/promises';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { sha256Canonical } from './canonical-json.js';
import { DomainError } from './domain-error.js';
import { PostgresCargoPlaceRepository } from './postgres-cargo-place.repository.js';
import type { CommandContext, CreateCargoPlaceInput } from './types.js';
import { PostgresService } from '../database/postgres.service.js';

const runWithDatabase = process.env.DATABASE_URL ? describe : describe.skip;

runWithDatabase('CreateCargoPlace PostgreSQL transaction', () => {
  let postgres: PostgresService;
  let repository: PostgresCargoPlaceRepository;

  const context: CommandContext = {
    actorUserId: '018f6f4d-7b20-7a10-8000-000000000001',
    branchId: '018f6f4d-7b20-7a10-8000-000000000002',
    deviceId: '018f6f4d-7b20-7a10-8000-000000000003',
  };
  const input: CreateCargoPlaceInput = {
    operationId: '018f6f4d-7b20-7a10-8000-000000000010',
    expectedOrderVersion: 1,
    occurredAt: '2026-09-01T10:00:00.000Z',
    orderId: '018f6f4d-7b20-7a10-8000-000000000020',
    place: {
      id: '018f6f4d-7b20-7a10-8000-000000000030',
      placeNumber: 1,
      placeCountAtCreation: 1,
      humanLabel: 'ORD-42-1-1',
    },
    measurement: {
      id: '018f6f4d-7b20-7a10-8000-000000000040',
      dimensionState: 'complete',
      length: 100,
      width: 50,
      height: 40,
      dimensionUnit: 'cm',
      weight: 25.5,
      weightUnit: 'kg',
      weightSource: 'measured',
      measuredAt: '2026-09-01T09:59:00.000Z',
    },
    label: { id: '018f6f4d-7b20-7a10-8000-000000000050' },
  };

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL!);
    const databaseName = decodeURIComponent(url.pathname.slice(1));
    if (!databaseName.endsWith('_test')) {
      throw new Error(`Refusing destructive integration setup for non-test database: ${databaseName}`);
    }
    postgres = new PostgresService();
    repository = new PostgresCargoPlaceRepository(postgres);
    await postgres.pool.query('drop schema if exists zaberman cascade');
    const migration = await readFile(new URL('../../../database/postgres/001_initial_schema.sql', import.meta.url), 'utf8');
    await postgres.pool.query(migration);
    await postgres.pool.query(
      `insert into zaberman.branches (id, code, name) values ($1, 'TST', 'Test Branch');
       insert into zaberman.app_users (id, external_subject, display_name) values ($2, 'test-user', 'Test User');
       insert into zaberman.devices (id, user_id, branch_id, platform) values ($3, $2, $1, 'android');
       insert into zaberman.roles (code, name) values ('operator', 'Operator');
       insert into zaberman.permissions (code, description) values ('cargo_place.create', 'Create cargo place');
       insert into zaberman.role_permissions (role_code, permission_code) values ('operator', 'cargo_place.create');
       insert into zaberman.user_branch_roles (user_id, branch_id, role_code) values ($2, $1, 'operator');
       insert into zaberman.orders (
         id, source_system, external_id, order_number, movement_type, origin_branch_id, version
       ) values ($4, 'test', 'order-42', 'ORD-42', 'local_standard', $1, 1);`,
      [context.branchId, context.actorUserId, context.deviceId, input.orderId],
    );
  });

  afterAll(async () => {
    if (!postgres) return;
    await postgres.pool.query('drop schema if exists zaberman cascade');
    await postgres.onApplicationShutdown();
  });

  it('atomically creates and exactly replays one business result', async () => {
    const hash = sha256Canonical({ context, input });
    const first = await repository.create(input, context, hash);
    const replay = await repository.create(input, context, hash);
    expect(replay).toEqual(first);
    expect(first.label.barcodePayload).toBe(`ZB1:${input.place.id}`);

    const changedInput = structuredClone(input);
    changedInput.place.humanLabel = 'ORD-42-CHANGED';
    await expect(repository.create(changedInput, context, sha256Canonical({ context, input: changedInput })))
      .rejects.toMatchObject<Partial<DomainError>>({ code: 'idempotency_key_reused', httpStatus: 409 });

    const counts = await postgres.pool.query<{
      places: string;
      measurements: string;
      labels: string;
      events: string;
      outbox: string;
      commands: string;
    }>(`select
         (select count(*) from zaberman.cargo_places)::text as places,
         (select count(*) from zaberman.cargo_place_measurements)::text as measurements,
         (select count(*) from zaberman.place_label_aliases)::text as labels,
         (select count(*) from zaberman.place_events)::text as events,
         (select count(*) from zaberman.outbox_messages)::text as outbox,
         (select count(*) from zaberman.command_requests)::text as commands`);
    expect(counts.rows[0]).toEqual({
      places: '1', measurements: '1', labels: '1', events: '3', outbox: '1', commands: '1',
    });
  });
});
