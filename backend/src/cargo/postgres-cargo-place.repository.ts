import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { PostgresService } from '../database/postgres.service.js';
import type { CargoPlaceRepository } from './cargo-place.repository.js';
import { DomainError } from './domain-error.js';
import type { CommandContext, CreateCargoPlaceInput, CreateCargoPlaceResult } from './types.js';
import { uuidV7 } from './uuid-v7.js';

interface ExistingCommandRow {
  request_hash: string;
  status: 'received' | 'applied' | 'retry' | 'conflict' | 'rejected';
  result_payload: CreateCargoPlaceResult | null;
  error_code: string | null;
  error_message: string | null;
  retryable: boolean;
}

interface PgFailure {
  code?: string;
  constraint?: string;
}

function isPgFailure(error: unknown): error is PgFailure {
  return error !== null && typeof error === 'object';
}

@Injectable()
export class PostgresCargoPlaceRepository implements CargoPlaceRepository {
  constructor(private readonly postgres: PostgresService) {}

  async create(
    input: CreateCargoPlaceInput,
    context: CommandContext,
    requestHash: string,
  ): Promise<CreateCargoPlaceResult> {
    let client: PoolClient | undefined;
    let transactionFinished = false;
    try {
      client = await this.postgres.pool.connect();
      await client.query('begin');

      const existing = await this.findCommand(client, input.operationId);
      if (existing) {
        const replay = this.replay(existing, requestHash);
        await client.query('commit');
        transactionFinished = true;
        return replay;
      }

      await this.assertAuthorized(client, context);
      const order = await client.query<{ version: number; origin_branch_id: string | null }>(
        'select version, origin_branch_id from zaberman.orders where id = $1 for share',
        [input.orderId],
      );
      if (order.rowCount !== 1) {
        throw new DomainError('order_not_found', 'Order was not found', 404);
      }
      if (order.rows[0]!.origin_branch_id !== context.branchId) {
        throw new DomainError('order_out_of_scope', 'Order does not belong to the active origin branch', 403);
      }

      const insertedCommand = await client.query<{ id: string }>(
        `insert into zaberman.command_requests (
           id, command_type, entity_type, entity_id, branch_id, actor_user_id, device_id,
           expected_version, request_hash, request_payload, occurred_at
         ) values ($1, 'create_cargo_place', 'cargo_place', $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
         on conflict (id) do nothing
         returning id`,
        [
          input.operationId,
          input.place.id,
          context.branchId,
          context.actorUserId,
          context.deviceId ?? null,
          input.expectedOrderVersion ?? null,
          requestHash,
          JSON.stringify(input),
          input.occurredAt,
        ],
      );
      if (insertedCommand.rowCount !== 1) {
        const racedCommand = await this.findCommand(client, input.operationId);
        if (!racedCommand) throw new Error('Idempotency command disappeared after conflict');
        const replay = this.replay(racedCommand, requestHash);
        await client.query('commit');
        transactionFinished = true;
        return replay;
      }

      const actualOrderVersion = order.rows[0]!.version;
      if (input.expectedOrderVersion !== undefined && input.expectedOrderVersion !== actualOrderVersion) {
        const conflict = new DomainError(
          'order_version_conflict',
          `Expected order version ${input.expectedOrderVersion}, actual version is ${actualOrderVersion}`,
          409,
        );
        await this.finishCommandWithError(client, input.operationId, conflict);
        await client.query('commit');
        transactionFinished = true;
        throw conflict;
      }

      await client.query('savepoint cargo_place_mutation');
      try {
        const result = await this.applyCreate(client, input, context);
        await client.query(
          `update zaberman.command_requests
             set status = 'applied', result_payload = $2::jsonb, completed_at = clock_timestamp()
           where id = $1`,
          [input.operationId, JSON.stringify(result)],
        );
        await client.query('release savepoint cargo_place_mutation');
        await client.query('commit');
        transactionFinished = true;
        return result;
      } catch (error) {
        if (!isPgFailure(error) || error.code !== '23505') throw error;
        await client.query('rollback to savepoint cargo_place_mutation');
        const conflict = this.uniqueConflict(error.constraint);
        await this.finishCommandWithError(client, input.operationId, conflict);
        await client.query('commit');
        transactionFinished = true;
        throw conflict;
      }
    } catch (error) {
      if (client && !transactionFinished) {
        await client.query('rollback').catch(() => undefined);
      }
      if (error instanceof DomainError) throw error;
      throw new DomainError('database_unavailable', 'Cargo place could not be persisted', 503, true);
    } finally {
      client?.release();
    }
  }

  private async applyCreate(
    client: PoolClient,
    input: CreateCargoPlaceInput,
    context: CommandContext,
  ): Promise<CreateCargoPlaceResult> {
    const barcodePayload = `ZB1:${input.place.id}`;
    await client.query(
      `insert into zaberman.cargo_places (
         id, order_id, place_number, place_count_at_creation, human_label,
         current_location_kind, current_branch_id, version, created_by_command_id
       ) values ($1, $2, $3, $4, $5, 'branch', $6, 1, $7)`,
      [
        input.place.id,
        input.orderId,
        input.place.placeNumber,
        input.place.placeCountAtCreation,
        input.place.humanLabel,
        context.branchId,
        input.operationId,
      ],
    );
    await client.query(
      `insert into zaberman.cargo_place_measurements (
         id, cargo_place_id, command_id, dimension_state, length, width, height, dimension_unit,
         weight, weight_unit, weight_source, unknown_reason, measured_by_user_id, measured_at
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        input.measurement.id,
        input.place.id,
        input.operationId,
        input.measurement.dimensionState,
        input.measurement.length ?? null,
        input.measurement.width ?? null,
        input.measurement.height ?? null,
        input.measurement.dimensionUnit,
        input.measurement.weight ?? null,
        input.measurement.weightUnit,
        input.measurement.weightSource,
        input.measurement.unknownReason ?? null,
        context.actorUserId,
        input.measurement.measuredAt,
      ],
    );
    await client.query(
      `insert into zaberman.place_label_aliases (
         id, cargo_place_id, label_code, barcode_payload, barcode_format_version, created_by_command_id
       ) values ($1, $2, $3, $4, 1, $5)`,
      [input.label.id, input.place.id, input.place.humanLabel, barcodePayload, input.operationId],
    );

    const events = [
      { type: 'place_created', version: 1, payload: { orderId: input.orderId, ...input.place } },
      { type: 'measurement_recorded', version: 2, payload: input.measurement },
      { type: 'label_generated', version: 3, payload: { labelId: input.label.id, barcodePayload } },
    ] as const;
    for (const [index, event] of events.entries()) {
      await client.query(
        `insert into zaberman.place_events (
           id, command_id, command_sequence, cargo_place_id, event_type, entity_version,
           actor_user_id, device_id, branch_id, occurred_at, source, payload
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'api', $11::jsonb)`,
        [
          uuidV7(),
          input.operationId,
          index + 1,
          input.place.id,
          event.type,
          event.version,
          context.actorUserId,
          context.deviceId ?? null,
          context.branchId,
          input.occurredAt,
          JSON.stringify(event.payload),
        ],
      );
    }
    await client.query(
      `update zaberman.cargo_places
          set current_measurement_id = $2, version = 3
        where id = $1`,
      [input.place.id, input.measurement.id],
    );

    const result: CreateCargoPlaceResult = {
      operationId: input.operationId,
      status: 'applied',
      appliedAt: new Date().toISOString(),
      cargoPlace: {
        id: input.place.id,
        orderId: input.orderId,
        placeNumber: input.place.placeNumber,
        placeCountAtCreation: input.place.placeCountAtCreation,
        humanLabel: input.place.humanLabel,
        version: 3,
        currentMeasurement: input.measurement,
      },
      label: {
        id: input.label.id,
        labelCode: input.place.humanLabel,
        barcodePayload,
        barcodeFormatVersion: 1,
        status: 'active',
      },
    };
    await client.query(
      `insert into zaberman.outbox_messages (aggregate_type, aggregate_id, event_type, payload)
       values ('cargo_place', $1, 'cargo_place.created', $2::jsonb)`,
      [input.place.id, JSON.stringify(result)],
    );
    return result;
  }

  private async findCommand(client: PoolClient, operationId: string): Promise<ExistingCommandRow | undefined> {
    const result = await client.query<ExistingCommandRow>(
      `select request_hash, status, result_payload, error_code, error_message, retryable
         from zaberman.command_requests where id = $1 for update`,
      [operationId],
    );
    return result.rows[0];
  }

  private replay(command: ExistingCommandRow, requestHash: string): CreateCargoPlaceResult {
    if (command.request_hash !== requestHash) {
      throw new DomainError('idempotency_key_reused', 'operationId was already used with a different request or context', 409);
    }
    if (command.status === 'applied' && command.result_payload) return command.result_payload;
    if (command.status === 'conflict' || command.status === 'rejected') {
      throw new DomainError(
        command.error_code ?? 'command_rejected',
        command.error_message ?? 'Command was rejected',
        command.status === 'conflict' ? 409 : 400,
        command.retryable,
      );
    }
    throw new DomainError('command_in_progress', 'Command has not reached a terminal state', 409, true);
  }

  private async assertAuthorized(client: PoolClient, context: CommandContext): Promise<void> {
    const authorization = await client.query<{ status: string; allowed: boolean }>(
      `select u.status,
              exists (
                select 1
                  from zaberman.user_branch_roles ubr
                  join zaberman.role_permissions rp on rp.role_code = ubr.role_code
                  join zaberman.branches b on b.id = ubr.branch_id and b.is_active
                 where ubr.user_id = u.id
                   and ubr.branch_id = $2
                   and rp.permission_code = 'cargo_place.create'
                   and (ubr.valid_until is null or ubr.valid_until > now())
              ) as allowed
         from zaberman.app_users u
        where u.id = $1`,
      [context.actorUserId, context.branchId],
    );
    if (authorization.rowCount !== 1 || authorization.rows[0]!.status !== 'active' || !authorization.rows[0]!.allowed) {
      throw new DomainError('permission_denied', 'Active cargo_place.create permission is required in the branch', 403);
    }
    if (context.deviceId) {
      const device = await client.query(
        `select 1 from zaberman.devices
          where id = $1 and user_id = $2 and status = 'active'
            and (branch_id is null or branch_id = $3)`,
        [context.deviceId, context.actorUserId, context.branchId],
      );
      if (device.rowCount !== 1) {
        throw new DomainError('device_denied', 'Device is inactive or outside the user/branch scope', 403);
      }
    }
  }

  private async finishCommandWithError(client: PoolClient, operationId: string, error: DomainError): Promise<void> {
    await client.query(
      `update zaberman.command_requests
          set status = 'conflict', error_code = $2, error_message = $3,
              retryable = $4, completed_at = clock_timestamp()
        where id = $1`,
      [operationId, error.code, error.message, error.retryable],
    );
  }

  private uniqueConflict(constraint?: string): DomainError {
    if (constraint === 'cargo_places_order_id_place_number_key') {
      return new DomainError('place_number_conflict', 'The order already has this place number', 409);
    }
    if (constraint?.includes('human_label') || constraint?.includes('label_code')) {
      return new DomainError('human_label_conflict', 'The human label is already in use', 409);
    }
    if (constraint?.includes('barcode_payload') || constraint?.includes('pkey')) {
      return new DomainError('identifier_conflict', 'One of the supplied identifiers is already in use', 409);
    }
    return new DomainError('cargo_place_conflict', 'Cargo place conflicts with existing data', 409);
  }
}
