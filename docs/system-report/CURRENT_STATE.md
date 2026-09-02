# Реализованный контекст проекта

Дата среза: 2026-09-02

Назначение: единая точка входа перед следующим этапом разработки.

## 1. Текущий вывод

Проект состоит из трёх разных по зрелости контуров:

1. работающий интерактивный React/Vite wireframe для согласования процессов;
2. подготовленный, но ещё не применённый PostgreSQL DDL baseline;
3. собранный NestJS vertical slice `Create CargoPlace` с OpenAPI, unit-тестами и условным PostgreSQL integration-тестом.

Текущая цель — демонстрация owner, не создание рабочего приложения. Этапы 3–4 (mock-фото/offline и выборочная печать labels) реализованы локально; следующий этап — комментарии сторон и представление eBOL/POD по [OWNER_DEMO_PLAN.md](OWNER_DEMO_PLAN.md). Production mobile client, развёрнутый backend, настоящая identity, интеграции и серверная БД отсутствуют. Runtime PostgreSQL gate относится к отдельному будущему production-backlog и не блокирует demo-этапы.

Правило показа от 2026-09-02: рабочие экраны выглядят как будущий продукт, без Simulate/demo/mock/prototype-пояснений; о природе wireframe ведущий предупреждает устно. Print и Print history, фото/sync, Scan, подписание и документы приведены к этому правилу. Служебная панель остаётся по `#/more/demo`, её ссылки из обычного UI скрыты. Реальные интеграции не добавлены.

## 2. Источники истины

Для AS-IS факта использовать код, тесты и migrations. Для TO-BE поведения использовать утверждённые product decisions. При расхождениях внутри одной категории действует следующий приоритет:

1. фактический код, тесты и SQL migrations — AS-IS;
2. [STAGE_0_PRODUCT_DECISIONS.md](STAGE_0_PRODUCT_DECISIONS.md) и [BOL_DECISION_LOG.md](../../BOL_DECISION_LOG.md) — утверждённый TO-BE baseline;
3. этот текущий срез;
4. [SYSTEM_ANALYSIS.md](SYSTEM_ANALYSIS.md), [ARCHITECTURE.md](ARCHITECTURE.md) и [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) как целевая модель;
5. [OWNER_DEMO_PLAN.md](OWNER_DEMO_PLAN.md) — текущий scope, нумерация и критерии demo-этапов 3–7; [WIREFRAME_IMPLEMENTATION_PLAN.md](../../WIREFRAME_IMPLEMENTATION_PLAN.md) — сводка плана и исторический каталог;
6. исходные ТЗ и audit-пакет как исторические источники требований.

Опубликованный Git baseline: `main`, commit `298ff87` (`fix: compact pickup dimension groups and remove demo banner`). Принятый пересмотр плана и реализации Этапов 3–4 находятся в локальной рабочей копии, ещё без commit/push. Этап 3 принят owner; этапы 5–7 не реализованы.

## 3. Что фактически реализовано

| Контур | Реализовано | Граница |
|---|---|---|
| Навигация | `Home | Tasks | Scan | More`, Cargo places и secondary Interstate | Часть legacy-экранов в `src` не подключена к `App.tsx` |
| Pickup/Dropoff | Autosaved/restored Pickup draft, dimension group CRUD с индивидуальными PlaceID, заполненные route mock-заявки, history, Recent Operations edit и mock Dropoff reconcile | Только `localStorage`; нет реальных задач, камеры, файлов и server confirmation |
| CargoPlace | Prototype PlaceID, `n/N`, labels, current status/location и короткая история | Проекция вычисляется из mock/local state |
| Labels / Scan | All/selected/one, preview выбранных Code 128, version filter, mock print/reprint history, printer unavailable, valid/duplicate/unknown и manual lookup | Нет printer SDK или аппаратного scan; Print моделирует результат локально |
| Order eBOL/POD | Pickup/Delivery review, locked original snapshot, Supplemental Pickup versions, повторные mock-подписи и POD preview | Подписи и PDF не production/legal artifacts |
| Фото | Отдельные mock-фото, категории, preview/filter/remove, восстановление Pickup/Delivery, фото своих версий в review/POD | Только metadata и существующие demo-assets; без файлов и upload |
| Interstate | Loading review, Trip, immutable loaded manifest в domain model, Unloading draft, BOL archive | Нет authoritative Trip service и atomic server Close |
| Scenario controls | Роль, филиал, сеть, sync и print outcomes, camera/scanner/printer, normal/offline/conflict/40/100-photo presets, reset | Только управляемая демонстрация |
| Persistence/sync | Versioned `localStorage`, очередь operation/photo с retry, сохранение ошибок, явный Keep local changes для demo-конфликта | Нет SQLite, durable outbox/inbox, реального merge и server sync |
| Backend API | NestJS `POST /api/cargo-places`, OpenAPI, validation, permission check, idempotency и atomic transaction | Только первый command slice; development identity adapter, без deploy |
| PostgreSQL | Две migrations; PD-011/PD-012 и `label_generated` отражены в DDL | Не применены к PostgreSQL 16 и не подключены к приложению |

Активный wireframe использует `HashRouter`, `CargoProvider`, `InterstateProvider` и `PrototypeScenarioProvider`. Основные данные сохраняются в ключах `zaberman-*` браузерного `localStorage`.

## 4. Подтверждённые бизнес-решения

Детальный нормативный baseline Этапа 0: [STAGE_0_PRODUCT_DECISIONS.md](STAGE_0_PRODUCT_DECISIONS.md).

- `CargoPlace` — единица физического учёта; Order обязателен, Interstate Trip — нет.
- Pickup и Dropoff — самостоятельные операции. Same Day связывает их через `RouteRun`.
- Order eBOL относится к Order; POD — финальное представление завершённого Order eBOL.
- Interstate BOL относится к Trip и подтверждённой версии manifest.
- Unloading сверяется с confirmed loading manifest, а не с исходным заказом.
- Damage не блокирует handoff при обязательных evidence/reason.
- Подтверждённые события и snapshots не редактируются; исправление создаёт новую версию или compensating event.
- Offline Close может получить только `ready_to_close`; окончательный `closed` устанавливает сервер.
- Target PlaceID — opaque UUIDv7, а человекочитаемая этикетка является alias. Формат wireframe `ZB-{ORDER}-{NN}` не является production primary key.

## 5. PostgreSQL baseline

[`database/postgres/001_initial_schema.sql`](../../database/postgres/001_initial_schema.sql) описывает identity/scope, operational cache Order/Task/RouteRun, CargoPlace и measurements, operations/events, Trips/manifests, discrepancies, documents/signatures, media metadata, idempotency, outbox, integrations и audit. Также созданы read views `cargo_place_current_v` и `cargo_place_history_v`.

[`database/postgres/002_api_context_rls.sql`](../../database/postgres/002_api_context_rls.sql) — optional defence-in-depth слой для branch-scoped read-only доступа. Он намеренно не завершает write authorization: командные записи должны идти через backend domain service.

Статус: DDL и command transaction реализованы в source, но не подтверждены на runtime PostgreSQL.

## 6. Production implementation gaps — вне текущей demo-приёмки

| Приоритет | Расхождение | Решение до API implementation |
|---|---|---|
| P0 | Migrations не применялись к чистому PostgreSQL 16 | Добавить ephemeral DB check и database tests до использования схемы |
| P1 | Конкретный Order/Dispatch vendor не выбран | Ownership boundary принят по PD-014; настроить adapter после выбора system code |
| P1 | Production IdP/role mapping отсутствует | Development adapter закрыт в production; подключить verified token claims и mapping |
| P1 | Opaque barcode contract реализован только в API | Провести scanner/printer hardware spike и добавить фактические print events |
| P1 | RLS покрывает только optional read path | Спроектировать trusted service role, grants и write authorization после access matrix |
| P1 | Same Day UI существует только как legacy/плановый контур и не подключён к активному router | Не считать сценарий реализованным; включать только после выбора MVP scope |

## 7. Проверенное состояние

Frontend перепроверен 2026-09-02; backend-результаты остаются от 2026-09-01:

- Vitest: 16 файлов, 67 тестов — passed;
- TypeScript project build — passed;
- Vite production build — passed;
- Backend Vitest: 2 файла, 10 unit-тестов — passed; PostgreSQL suite: 1 test skipped без `DATABASE_URL`;
- Backend TypeScript build — passed;
- Compiled backend bootstrap и `GET /api/health` — passed;
- PostgreSQL migrations — только статически просмотрены; runtime apply/rollback/RLS checks не выполнялись из-за отсутствия PostgreSQL runtime;
- production integrations и живые данные не проверялись и не изменялись;
- rendered QA Этапа 2: Chrome/Playwright fallback на локальном production preview, ширины 320/390/1440 px; group CRUD, restore, review, original + supplemental signing пройдены. In-app Browser по-прежнему блокируется Windows sandbox `setup refresh`; необязательный favicon возвращает 404.
- rendered QA Этапа 3: photo CRUD/filter/preview, offline/reload/retry/conflict, immutable original/supplemental/Delivery evidence, POD, presets и camera fallback — passed. Детали: [STAGE_3_PHOTO_OFFLINE_DEMO.md](STAGE_3_PHOTO_OFFLINE_DEMO.md). Результат принят owner.
- rendered QA Этапа 4: выбор/reload, выбранные Code 128 и print media, mock success/error/reprint, unavailable printer, точный Scan и отдельные Supplemental labels — passed. [Детали](STAGE_4_LABEL_PRINT_DEMO.md). Приёмка Этапа 4 owner ещё не проведена.

## 8. Следующий этап wireframe

Следующий — Этап 5 «eBOL/POD: комментарии сторон и представление документа» по [OWNER_DEMO_PLAN.md](OWNER_DEMO_PLAN.md): отдельные комментарии контакта и водителя, сохранение в своей версии, document preview и честные mock Download/Print/Email/Share. Существующие signing и snapshots повторно не строить.

Затем: 6 — данные заказа и mock Spoke preview; 7 — репетиция owner-demo и UX-полировка. Готовые части текущего wireframe повторно не строить.

## 9. Отложенный production gate

Source-реализация `Create CargoPlace` описана в [STAGE_1_CREATE_CARGO_PLACE.md](STAGE_1_CREATE_CARGO_PLACE.md). После отдельного решения начать рабочее приложение нужно подтвердить её на PostgreSQL 16 test DB.

Готовый результат этапа:

1. поднята чистая PostgreSQL 16 БД с именем `*_test`;
2. `001_initial_schema.sql` применяется без ошибок;
3. integration test подтверждает atomic create, 3 события, outbox и точный replay;
4. отдельно добавляются проверки constraints, append-only triggers и optional RLS migration;
5. wireframe остаётся UX-reference и не подключается напрямую к PostgreSQL.

Production mobile shell/SQLite sync, BOL worker и реальный полевой пилот планируются отдельно. Это не является условием продолжения или приёмки owner-demo.
