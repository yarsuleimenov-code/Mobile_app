# PostgreSQL schema

Status: DDL plus the first command transaction as of 2026-09-01. The migrations have not yet been applied to a PostgreSQL 16 runtime. See [the current project context](../../docs/system-report/CURRENT_STATE.md) before implementation.

Server-side source of truth for orders/tasks cached from external systems and for Zaberman-owned cargo, warehouse, document and synchronization facts.

## Files

1. `001_initial_schema.sql` — schema `zaberman`, tables, constraints, indexes, immutable-history triggers and CargoPlace read views.
2. `002_api_context_rls.sql` — optional read-only RLS overlay for branch-scoped API/reporting sessions.

Apply migrations in order with a migration-owner account:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/postgres/001_initial_schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/postgres/002_api_context_rls.sql
```

The RLS migration is optional for the first API implementation. If applied, it intentionally exposes no write policies and therefore suits a read-only role. Command writes and background workers require separately reviewed grants/policies or a dedicated trusted service role. Do not give database credentials to the mobile app.

Before an RLS-protected read, the API validates the JWT and sets the application user in the same transaction:

```sql
begin;
select set_config('zaberman.user_id', '01952f7e-0000-7000-8000-000000000001', true);
select * from zaberman.cargo_place_current_v
where place_id = '01952f7e-0000-7000-8000-000000000002'::uuid;
commit;
```

The deployment DBA must explicitly grant the runtime role only the required schema/table/view privileges and execution on the six RLS helper functions. The migrations do not create login roles or credentials.

## Conventions

- UUID primary keys are UUIDv7 and are generated in the client/API, not by PostgreSQL.
- `command_requests.id` is the idempotency `operationId`.
- `version` plus `expected_version` provides optimistic concurrency.
- `place_events`, measurements, discrepancy events, signatures, snapshots and audit rows are append-only.
- PDF/photo/signature bytes live in object storage; PostgreSQL stores metadata and SHA-256.
- All time instants use `timestamptz`; physical values use `numeric` plus an explicit unit.
- Schema changes are forward-only migrations. Never edit an already deployed migration.

## Deployment checks

After applying, verify:

```sql
select table_name
from information_schema.tables
where table_schema = 'zaberman'
order by table_name;

select viewname
from pg_views
where schemaname = 'zaberman';
```

The application transaction that accepts a command must atomically write `command_requests`, domain rows/events, the current projection, and `outbox_messages`. A duplicate `command_requests.id` must return the stored `result_payload`; a reused ID with a different `request_hash` must be rejected.

The approved Stage 0 contracts for Order-owned `movement_type`, explicit measurement quality and separate `label_generated`/`label_printed` facts are implemented in `001_initial_schema.sql`. The first transaction and guarded integration test live in [`backend/`](../../backend/); run it against a disposable database whose name ends in `_test` before relying on the schema.
