# Zaberman backend — Stage 1

Minimal NestJS vertical slice for `POST /api/cargo-places`.

## Ready result

- validates UUIDv7 identifiers and explicit measurement quality;
- authorizes `cargo_place.create` in the selected branch;
- atomically writes command, cargo place, measurement, label alias, three events and outbox message;
- replays the exact stored result for the same `operationId` and request context;
- derives barcode payload as `ZB1:<opaque PlaceID>` and does not mark it as printed.

## Local run

1. Apply `../database/postgres/001_initial_schema.sql` to PostgreSQL 16+.
2. Copy `.env.example` to `.env` and seed the referenced user, branch, role and permission.
3. Export the variables from `.env` in the shell.
4. Run `pnpm install`, `pnpm test`, `pnpm build`, then `pnpm start:dev`.

`DEV_ACTOR_USER_ID`, `DEV_BRANCH_ID` and optional `DEV_DEVICE_ID` are a development-only identity boundary. With `NODE_ENV=production`, the endpoint refuses commands until a verified authentication adapter replaces it.

The database integration test runs only when `DATABASE_URL` is set and its database name ends with `_test`; otherwise it is reported as skipped.

API contract: `openapi.yaml`.
