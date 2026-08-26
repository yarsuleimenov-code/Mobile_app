# Технологический стек Zaberman Mobile

Дата: 2026-08-26  
Статус: рекомендуемый вариант; версии production dependencies фиксируются при старте реализации.

## 1. Решение

Рекомендуется:

- mobile: React Native + Expo + TypeScript;
- local data: SQLite + отдельное secure key-value storage + local file system;
- backend: Node.js LTS + NestJS, модульный монолит;
- API: REST + OpenAPI, idempotent mutations;
- database: PostgreSQL;
- files: S3-compatible object storage;
- async: PostgreSQL transactional outbox/job table на MVP, отдельные worker processes;
- BOL/POD: server-side HTML/template → PDF;
- identity: corporate OIDC/OAuth2 provider;
- observability: structured logs, metrics and traces through OpenTelemetry-compatible pipeline;
- CI/CD: GitHub Actions, signed mobile builds, container deployment, dev/staging/prod.

Причина выбора: максимальное переиспользование React/TypeScript компетенций текущего прототипа без ограничений PWA по camera, local database, secure storage и native integration. Архитектура остаётся простой: один backend codebase, одна transactional DB и отдельное file storage.

## 2. Текущий стек wireframe

| Область | Фактическая технология | Оценка |
|---|---|---|
| UI | React `19.1.1`, React DOM `19.1.1` | Подходит для web-прототипа |
| Routing | React Router DOM `7.8.2`, `HashRouter` | Подходит для GitHub Pages |
| Language | TypeScript `5.9.2`, strict | Доменные правила можно частично переиспользовать |
| Build | Vite `7.1.3` | Только web wireframe |
| Tests | Vitest `3.2.x` | 28 текущих тестов проходят |
| Barcode | JsBarcode `3.12.3` | Prototype Code 128 labels |
| Icons | Lucide React | Только presentation dependency |
| State | React Context/useState + `localStorage` | Mock; не production offline store |
| Integrations | Static fixtures + artificial delays | Реальных API нет |
| Deploy | GitHub Actions → GitHub Pages | Только публичный prototype hosting |

Можно переиспользовать: TypeScript domain calculations, terminology, test cases, visual references и часть React-компонентной логики. Нельзя переносить как production foundation: DOM/CSS layout, `HashRouter`, browser `localStorage`, mock sync, in-memory Trip state и GitHub Pages deployment.

## 3. Mobile application

### Рекомендуемый вариант: React Native + Expo

| Потребность | Технология/подход |
|---|---|
| Navigation | Expo Router или React Navigation; выбрать один после route spike |
| Local DB | `expo-sqlite`, migrations, indexes, transactions |
| Tokens/device secret | `expo-secure-store`; не хранить большие payload |
| Camera/barcodes | `expo-camera`; camera scan + photo capture |
| Local photos/docs | `expo-file-system` |
| Print/PDF handoff | `expo-print`/system print; vendor SDK через adapter при необходимости |
| Network state | NetInfo + application-level reachability |
| Background retry | Expo BackgroundTask как best-effort, не единственный trigger |
| Forms/validation | Typed form model + shared schemas; конкретную библиотеку выбрать при implementation |
| Server state | Query/cache library допустима, но SQLite остаётся durable offline source |
| UI state | Local component/context state; глобальный state manager только при доказанной необходимости |

Официальные Expo APIs подтверждают persistent SQLite, secure encrypted key-value storage, camera/barcode scanning, local filesystem, Android/iOS printing и deferrable background tasks. Background execution зависит от решений ОС, сети и батареи, поэтому `Sync now`, foreground/resume и network recovery обязательны.

### Ограничения

- Expo Go недостаточен для полного pilot; нужен development build с реальными native permissions/modules.
- Конкретные Bluetooth/USB printers или industrial scanners могут потребовать vendor native module.
- iOS/Android background execution не гарантирует точное время.
- Device matrix проверяется на реальном hardware до масштабирования.

## 4. Mobile data architecture

### SQLite tables

Минимум:

```text
cached_entities
tasks
orders
cargo_places
draft_operations
outbox_operations
inbox_changes
sync_checkpoints
media_queue
cached_documents
```

`outbox_operations` содержит immutable request payload, dependency, attempts, next retry, last error и status. UI projections могут обновляться оптимистично, но исходная operation сохраняется до server confirmation.

### Secure storage

Использовать только для refresh token/device secret и малых security values. Business data, tasks, manifests и photos не хранить в secure key-value store; для них используются SQLite/files с установленной security policy.

### Encryption

- OS device encryption и app sandbox — baseline.
- SQLCipher/дополнительное шифрование SQLite — decision после threat model, MDM и требований к PII.
- Независимо от решения, tokens остаются в secure storage.

## 5. Backend

### Node.js + NestJS

Рекомендуется по причинам:

- единый TypeScript stack с mobile/domain schemas;
- понятное модульное разделение;
- built-in patterns для validation, guards, OpenAPI, file upload и background jobs;
- простой найм и поддержка одной командой;
- возможность запускать API и workers из одного codebase.

Структура без избыточных слоёв:

```text
apps/api
apps/worker
packages/contracts
packages/domain
modules/identity
modules/orders
modules/cargo
modules/trips
modules/events
modules/discrepancies
modules/documents
modules/media
modules/integrations
```

Не создавать отдельный сервис на каждый модуль. Разделение на services выполняется только по доказанным требованиям масштабирования, security boundary или независимого lifecycle.

### API

- REST/JSON и generated OpenAPI;
- schema validation на boundary;
- pagination/cursors;
- `operationId` unique для каждой mutation;
- `expectedVersion`/ETag для изменяемых агрегатов;
- RFC 7807-style problem details или единый typed error contract;
- signed URLs для upload/download файлов;
- backward-compatible versioning.

GraphQL не нужен для MVP: основные mobile сценарии имеют ясные task/operation boundaries, а REST проще для offline replay и поддержки.

## 6. PostgreSQL

PostgreSQL — system of record для operational facts, events, manifests, discrepancies, document metadata, idempotency и integration outbox.

Обязательные механизмы:

- UUID primary keys;
- unique constraints на `operation_id`, `place_id`, business numbers/versions;
- foreign keys и check constraints;
- transactions для Close Loading/Unloading;
- optimistic entity version;
- indexes по assignment/status/warehouse/time;
- row locking или Serializable только для операций, где это оправдано;
- partitioning events/media metadata только после измерения объёма;
- schema migrations в CI/CD.

PostgreSQL документирует UUID как подходящий идентификатор для distributed systems и поддерживает UUIDv4/v7. Транзакционные guarantees и unique constraints закрывают риски row-number updates, TripID collision и неатомарного Close из старой схемы.

Google Sheets не использовать как primary transactional database. Sheets допустимы только как временный integration endpoint/report в migration period.

## 7. Files and documents

### Object storage

Хранит:

- original/optimized photos;
- generated labels при необходимости;
- external BOL files;
- generated Order eBOL/POD/Interstate BOL PDFs;
- signed document versions.

PostgreSQL хранит `fileId`, storage key, checksum, MIME type, size, category, owner entity, uploader, timestamps, version, retention class и status.

### Upload

1. Mobile создаёт upload session.
2. Backend проверяет permission и выдаёт short-lived signed URL.
3. Mobile загружает/повторяет файл отдельно от business mutation.
4. Mobile подтверждает upload с checksum.
5. Worker выполняет validation/thumbnail/malware policy.
6. Operation получает `synced` или `needs_attention` по photo checklist policy.

### PDF generation

Рекомендуется server-side worker с versioned HTML/CSS template и headless Chromium renderer. В registry сохраняются template version, source snapshot/hash, document version и file checksum. Повтор того же generation request должен возвращать исходный документ.

## 8. Asynchronous processing

### MVP

Использовать PostgreSQL transactional outbox + job table:

- BOL/POD generation;
- media processing;
- Spoke/Kommo/legacy notifications;
- reconciliation;
- scheduled retries.

Преимущество: нет отдельной Redis infrastructure до появления реальной нагрузки.

### Когда добавлять Redis/BullMQ

- высокая очередь CPU/IO jobs;
- несколько независимых worker pools;
- нужна приоритизация/throughput, которые job table уже не закрывает;
- измеренная нагрузка оправдывает дополнительную эксплуатацию.

NestJS официально поддерживает BullMQ/Redis, но это следующий шаг, а не обязательный MVP-компонент.

## 9. Identity and authorization

- OIDC/OAuth2 corporate IdP;
- Authorization Code + PKCE для mobile;
- short-lived access token;
- refresh token в secure storage;
- app authorization DB: capabilities, branch scope, assignments, device status;
- server-side guards на каждый endpoint;
- remote revoke/device disable;
- audit login, permission denial и sensitive document access.

Выбор конкретного IdP зависит от корпоративной инфраструктуры и не должен фиксироваться без IT.

## 10. Observability and operations

Минимум:

- JSON structured logs с `traceId`, `operationId`, user/device pseudonymous IDs;
- metrics: sync latency, pending age, rejection/conflict rate, scan errors, upload failures, BOL queue age;
- distributed traces для API → DB → worker → integration;
- alerting: stuck jobs, BOL failures, reconciliation drift, elevated auth failures;
- support views: найти operation/Place/Trip/Document без доступа к raw secrets;
- runbooks для retry, reprocess, revoke device, reconcile и restore.

OpenTelemetry-compatible instrumentation снижает зависимость от конкретного observability vendor.

## 11. Testing

| Уровень | Что проверяется |
|---|---|
| Unit | calculations, lifecycle, permissions, conflict rules, label parsing |
| Contract | OpenAPI schemas, sync payloads, integration mappings |
| Database | constraints, idempotency, transaction rollback, migrations |
| Component | mobile forms, scan results, offline statuses, accessibility |
| E2E | Pickup/Dropoff, offline restart, duplicate retry, conflict, Loading/Unloading, BOL |
| Device | camera, low light, gloves, external scanner, printers, background/kill/restart |
| Security | authz bypass, token handling, signed URL, upload validation, PII logging |
| Resilience | network loss, timeout after commit, worker crash, duplicate webhook, restore |

Текущие Vitest cases следует перенести как domain acceptance examples. Для mobile E2E инструмент выбирается после Expo/device spike; браузерный Playwright остаётся для wireframe и admin web, но не заменяет real-device tests.

## 12. CI/CD and environments

- GitHub Actions: format/lint/typecheck/unit/contract/security/build;
- dependency lockfile и automated update review;
- signed iOS/Android builds; distribution через stores или MDM;
- backend container image с immutable tag/SBOM;
- database migration as controlled deployment step;
- dev/staging/prod с отдельными DB, buckets, IdP clients и secrets;
- feature flags только для безопасного rollout, не как замена бизнес-решениям;
- rollback для API/mobile compatibility и document templates.

## 13. Сравнение клиентских вариантов

| Критерий | React Native + Expo | Flutter | Native iOS + Android | PWA |
|---|---:|---:|---:|---:|
| Переиспользование текущего TS/React опыта | Высокое | Низкое | Низкое | Высокое |
| Offline SQLite/files | Высокое | Высокое | Максимальное | Среднее |
| Camera/barcode | Высокое | Высокое | Максимальное | Среднее/зависит от browser |
| Background sync | Среднее, OS-limited | Среднее, OS-limited | Максимальный контроль | Низкое/нестабильное |
| Printer/vendor SDK | Среднее | Среднее | Максимальное | Низкое |
| Скорость одного cross-platform MVP | Высокая | Высокая | Низкая | Максимальная |
| Два mobile platform codebases | Нет | Нет | Да | Нет |
| Рекомендация | **Да** | Альтернатива при сильной Dart-команде | Только при жёстких hardware constraints | Только облегчённый companion/admin |

PWA не рекомендуется как основной field client из-за требований к offline durability, background behavior и периферии. Native следует выбирать только если hardware pilot докажет, что нужные scanners/printers/background flows нельзя надёжно закрыть React Native modules.

## 14. Что не добавлять заранее

- микросервисы;
- Kubernetes;
- Kafka/event streaming platform;
- Redis/BullMQ без нагрузки;
- GraphQL;
- сложный generic workflow engine;
- отдельную data warehouse платформу для операционного MVP;
- собственную криптографию;
- printer abstraction для невыбранных устройств;
- biometric/legally binding signature без утверждённого требования.

## 15. Технические источники

- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/) — camera, photo и barcode scanning.
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) — persistent local database.
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) — encrypted local key-value storage и ограничения размера.
- [Expo BackgroundTask](https://docs.expo.dev/versions/latest/sdk/background-task/) — best-effort background jobs и platform constraints.
- [Expo Print](https://docs.expo.dev/versions/latest/sdk/print/) — Android/iOS system printing.
- [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/) — local files and downloads.
- [React Native native platform integration](https://reactnative.dev/docs/native-platform) — native modules/components для vendor hardware.
- [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction) — generated REST contract.
- [NestJS queues](https://docs.nestjs.com/techniques/queues) — BullMQ option when Redis-backed queues become justified.
- [PostgreSQL UUID](https://www.postgresql.org/docs/current/datatype-uuid.html) — UUID and distributed identifiers.
- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) — concurrency/transaction guarantees.
- [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) — database integrity rules.

## 16. Решения до фиксации зависимостей

1. IdP и MDM.
2. Поддерживаемые iOS/Android versions и устройства.
3. Scanner/printer models и Code 128/QR requirements.
4. Object storage/hosting provider и residency.
5. SQLCipher requirement.
6. Master Order/Task/Trip systems.
7. Photo limits, compression, retention and privacy.
8. BOL/eBOL legal signature and PDF requirements.
9. Target availability/RPO/RTO.
10. Team skills and operational ownership.
