# Реализованный контекст проекта

Дата среза: 2026-09-02

Назначение: единая точка входа перед следующим этапом разработки.

## 1. Текущий вывод

Проект состоит из трёх разных по зрелости контуров:

1. работающий интерактивный React/Vite wireframe для согласования процессов;
2. подготовленный, но ещё не применённый PostgreSQL DDL baseline;
3. собранный NestJS vertical slice `Create CargoPlace` с OpenAPI, unit-тестами и условным PostgreSQL integration-тестом.

Текущая цель — демонстрация owner, не создание рабочего приложения. Этапы 3–6 приняты и опубликованы. Этап 7 реализован локально: семь пресетов, UX-защиты и две последовательные репетиции 7/7. Статус — готово к демонстрации, решение owner ожидается. [Инструкция и проверки](STAGE_7_OWNER_DEMO_REHEARSAL.md), [принятый план](OWNER_DEMO_PLAN.md). Production mobile client, развёрнутый backend, настоящая identity, интеграции и серверная БД отсутствуют. Runtime PostgreSQL gate относится к отдельному будущему production-backlog и не блокирует demo-этапы.

Правило показа от 2026-09-02 с уточнением owner от 2026-09-03: рабочие экраны выглядят как будущий продукт, без Simulate/demo/mock/prototype-пояснений; о природе wireframe ведущий предупреждает устно. Print и Print history, фото/sync, Scan, подписание и документы приведены к этому правилу. В More восстановлен пункт Administration → существующая служебная панель `#/more/demo`: роль, филиал, сеть, устройства и сценарии. Это исключение из прежнего скрытия входа; остальные рабочие экраны не меняются. Реальные интеграции и новая система прав доступа не добавлены.

## 2. Источники истины

Для AS-IS факта использовать код, тесты и migrations. Для TO-BE поведения использовать утверждённые product decisions. При расхождениях внутри одной категории действует следующий приоритет:

1. фактический код, тесты и SQL migrations — AS-IS;
2. [STAGE_0_PRODUCT_DECISIONS.md](STAGE_0_PRODUCT_DECISIONS.md) и [BOL_DECISION_LOG.md](../../BOL_DECISION_LOG.md) — утверждённый TO-BE baseline;
3. этот текущий срез;
4. [SYSTEM_ANALYSIS.md](SYSTEM_ANALYSIS.md), [ARCHITECTURE.md](ARCHITECTURE.md) и [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) как целевая модель;
5. [OWNER_DEMO_PLAN.md](OWNER_DEMO_PLAN.md) — текущий scope, нумерация и критерии demo-этапов 3–7; [WIREFRAME_IMPLEMENTATION_PLAN.md](../../WIREFRAME_IMPLEMENTATION_PLAN.md) — сводка плана и исторический каталог;
6. исходные ТЗ и audit-пакет как исторические источники требований.

Опубликованный Git baseline: `main`, commit `8756a6f` (`feat: add eBOL documents and order data owner demo flows`), включает принятые Этапы 5–6. Предыдущие Этапы 3–4 — `1d2a2d2`. Этап 7 реализован и проверен локально; owner acceptance и публикация пока не выполнены.

## 3. Что фактически реализовано

| Контур | Реализовано | Граница |
|---|---|---|
| Навигация | `Home | Tasks | Scan | More`, Cargo places и secondary Interstate | Часть legacy-экранов в `src` не подключена к `App.tsx` |
| Pickup/Dropoff | Autosaved/restored Pickup draft, dimension group CRUD с индивидуальными PlaceID, заполненные route mock-заявки, history, Recent Operations edit и mock Dropoff reconcile | Только `localStorage`; нет реальных задач, камеры, файлов и server confirmation |
| Данные заказа | Trade/internal names, отдельный Qty, source, role-gated edit/audit, Special Cargo, read-only Spoke preview; известные итоги и причины неполных измерений | Локальные fixtures и permissions; Fragile/Oversized и role mapping — demo-допущения |
| CargoPlace | Prototype PlaceID, `n/N`, labels, current status/location и короткая история | Проекция вычисляется из mock/local state |
| Labels / Scan | All/selected/one, preview выбранных Code 128, version filter, mock print/reprint history, printer unavailable, valid/duplicate/unknown и manual lookup | Нет printer SDK или аппаратного scan; Print моделирует результат локально |
| Order eBOL/POD | Pickup/Delivery review, отдельные comments сторон, locked snapshots, Supplemental versions, read-only история документов, POD и Download/Print/Email/Share dialogs | Подписи и PDF не production/legal artifacts |
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

- Vitest: 19 файлов, 102 теста — passed;
- TypeScript project build — passed;
- Vite production build — passed;
- Backend Vitest: 2 файла, 10 unit-тестов — passed; PostgreSQL suite: 1 test skipped без `DATABASE_URL`;
- Backend TypeScript build — passed;
- Compiled backend bootstrap и `GET /api/health` — passed;
- PostgreSQL migrations — только статически просмотрены; runtime apply/rollback/RLS checks не выполнялись из-за отсутствия PostgreSQL runtime;
- production integrations и живые данные не проверялись и не изменялись;
- rendered QA Этапа 2: Chrome/Playwright fallback на локальном production preview, ширины 320/390/1440 px; group CRUD, restore, review, original + supplemental signing пройдены. In-app Browser по-прежнему блокируется Windows sandbox `setup refresh`; необязательный favicon возвращает 404.
- rendered QA Этапа 3: photo CRUD/filter/preview, offline/reload/retry/conflict, immutable original/supplemental/Delivery evidence, POD, presets и camera fallback — passed. Детали: [STAGE_3_PHOTO_OFFLINE_DEMO.md](STAGE_3_PHOTO_OFFLINE_DEMO.md). Результат принят owner.
- rendered QA Этапа 4: выбор/reload, выбранные Code 128 и print media, mock success/error/reprint, unavailable printer, точный Scan и отдельные Supplemental labels — passed. [Детали](STAGE_4_LABEL_PRINT_DEMO.md). Этап 4 принят owner и опубликован.

- rendered QA Этапа 5: comments/reload/storage-error recovery, разные подписанные версии, refusal gate, POD и document actions — passed на 320/390/1440 px. [Детали](STAGE_5_EBOL_POD_DEMO.md). Этап принят owner.
- rendered QA Этапа 6: roles/names/audit/reload, Spoke preview, empty-name draft, nullable measurements/reason, согласованный Qty, frozen original/reprint, Supplemental — passed на 320/390/1440 px. [Детали](STAGE_6_ORDER_DATA_DEMO.md). Регрессии этапов 4–5 проходят; Этап 6 принят owner.

- rendered QA Этапа 7: два последовательных UI-only прогона 7/7, Reset/Cancel, 320/390/1440 px, защита order context/stale review/unsigned additions, отказ записи Delivery и успешный retry — passed. Регрессии этапов 5–6 проходят. [Инструкция и evidence](STAGE_7_OWNER_DEMO_REHEARSAL.md).

## 8. Следующий шаг wireframe

Показать owner семь сценариев по [STAGE_7_OWNER_DEMO_REHEARSAL.md](STAGE_7_OWNER_DEMO_REHEARSAL.md) и зафиксировать «принято / изменить / вне scope». Техническая подготовка Этапа 7 выполнена; бизнес-приёмка не заявляется до просмотра. Push — по отдельному запросу. Production integrations и полевой пилот не добавлять автоматически.

## 9. Отложенный production gate

Source-реализация `Create CargoPlace` описана в [STAGE_1_CREATE_CARGO_PLACE.md](STAGE_1_CREATE_CARGO_PLACE.md). После отдельного решения начать рабочее приложение нужно подтвердить её на PostgreSQL 16 test DB.

Готовый результат этапа:

1. поднята чистая PostgreSQL 16 БД с именем `*_test`;
2. `001_initial_schema.sql` применяется без ошибок;
3. integration test подтверждает atomic create, 3 события, outbox и точный replay;
4. отдельно добавляются проверки constraints, append-only triggers и optional RLS migration;
5. wireframe остаётся UX-reference и не подключается напрямую к PostgreSQL.

Production mobile shell/SQLite sync, BOL worker и реальный полевой пилот планируются отдельно. Это не является условием продолжения или приёмки owner-demo.
