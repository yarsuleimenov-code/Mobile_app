# Реализованный контекст проекта

Дата среза: 2026-10-05

Обновление 2026-10-06 — Requirements из временных Broker comment fixtures: раскрытый read-only блок Order details перед Team contacts, заметный фон, текст 16 px без обрезания, переносы строк и включение в Copy summary. Разные примеры для шести заказов; без данных блок скрыт. Реальная CRM/Spoke синхронизация отсутствует; Special Cargo, Order note и подписанные комментарии не изменены. Доставка вместе с другим заказом показана как инструкция, не автоматическая связь маршрута.

Обновление 2026-10-06 — визуальное разделение остановок Home/Tasks: каждый заказ заключён в белую карточку с рамкой 1 px, радиусом 8 px и внутренним отступом 10 px; между карточками 8 px. Внутренняя линия под заголовком удалена, отступы сокращены; заголовок, полный адрес и map/copy actions 44×44 сохранены. Бизнес-логика не изменена, RU/EN инструкции обновлены. Предыдущая запись об отсутствии внешних карточек заменена этим согласованным решением.

Обновление 2026-10-06 — иерархия остановок Home/Tasks: номер и operational name объединены в заголовке 17 px semibold системным шрифтом; длинные названия переносятся. Под тонким разделителем показаны операция, Stop, количество и время, ниже — полный адрес и прежние map/copy actions с зонами 44×44. Между остановками — отступ, без дополнительных панелей. Бизнес-логика не изменена; RU/EN инструкции синхронизированы. Проверены 152 теста, app/docs build, Pages artifact и UI в Chrome на 320/390/1440 px, включая длинное название, копирование адреса и переходы к операции, Order details и сообщениям. Проверка проводилась в изолированном браузерном контексте.

Обновление 2026-10-06 по принятому визуальному макету: Home сохраняет время, тип операции, Stop и Qty на узкой ширине; Order details водителя показывает сведения без disabled/read-only форм, External name/Source в Additional details; Tasks использует компактную ссылку Order details и customer-message icon с unread badge. Особые требования раскрыты, права Dispatcher/Supervisor сохранены. 152 tests/app build и UI на 320/390/1440 px проверены; RU/EN инструкции обновлены. Реализация принята owner; push в main разрешён. Технические отказы/конкурентные подтверждения исключены owner из текущего prototype scope и этим изменением не исправлялись.

Обновление 2026-10-06 принято owner, push в main разрешён: единственный вход Order details из Pickup/Dropoff, компактная сводка остановки и отдельный раздел Team contacts вместо дублирующих кнопок и вложенных карточек. Handling requirements показаны до контактов, Order note — после. RU/EN инструкции синхронизированы. [Спецификация](TEAM_CONTACTS_WIREFRAME.md).

Принято owner 2026-10-05: [Post-trip inspection](POST_TRIP_INSPECTION_WIREFRAME.md), история пар осмотров и новый цикл с обязательным Pre-trip; Dashboard и Company equipment & tools в обоих осмотрах. Осмотры содержат восемь проверок и пять фото-маркеров. [Комментарии каждой стороны на её экране](HANDOFF_COMMENTS_SIGNING_WIREFRAME.md) и equipment опубликованы в main коммитом 7580cd2. [Team contacts](TEAM_CONTACTS_WIREFRAME.md) с контекстом заказа, копированием, короткими handles и полными адресами принят и опубликован коммитом e821d0c. [Внешняя навигация](EXTERNAL_NAVIGATION_WIREFRAME.md) реализована и принята вместе с дополнительными UI/UX-улучшениями: Navigate в Google Maps и Copy address на пяти поверхностях, компактные списки и прямой переход к контактам; push в main разрешён.

Назначение: единая точка входа перед следующим этапом разработки.

P2 — компактные ручные Pickup/Dropoff реализованы по запросу owner с публикацией сразу в main: Home → Manual operations, две кнопки высотой 48 px вместо крупных плиток. Additional pickup сохранён через Recent operations → Add places и Pickup drafts → Supplemental Pickup; правила signed versions и Pre-trip gate не менялись. Подробности и проверки — [план BA weekly](BA_WEEKLY_2026_10_05_MOBILE_PLAN.md#p2-компактные-ручные-pickupdropoff-реализовано).

## 1. Текущий вывод

Проект состоит из трёх разных по зрелости контуров:

1. работающий интерактивный React/Vite wireframe для согласования процессов;
2. подготовленный, но ещё не применённый PostgreSQL DDL baseline;
3. собранный NestJS vertical slice `Create CargoPlace` с OpenAPI, unit-тестами и условным PostgreSQL integration-тестом.

Текущая цель — согласование бизнес-прототипа с owner, не создание рабочего приложения. Этапы 3–6 приняты owner; код Этапа 7 включён в main коммитом 762ffb5, но отдельная бизнес-приёмка owner в документах не зафиксирована. Позднее опубликованы вход More → Administration, email-копия Pickup eBOL, Customer SMS, обязательный Pre-trip inspection и OTP-подтверждение для Pickup и Delivery. Pre-trip и OTP приняты owner и находятся в main; соответствующие production-интеграции ещё не реализованы. [Инструкция Этапа 7](STAGE_7_OWNER_DEMO_REHEARSAL.md) сохраняет сценарии показа, [план](OWNER_DEMO_PLAN.md) — исторические критерии. Production mobile client, развёрнутый backend, настоящая identity, интеграции и серверная БД отсутствуют. Runtime PostgreSQL gate относится к отдельному production-backlog.

Правило показа от 2026-09-02 с уточнением owner от 2026-09-03: рабочие экраны выглядят как будущий продукт, без Simulate/demo/mock/prototype-пояснений; о природе wireframe ведущий предупреждает устно. Print и Print history, фото/sync, Scan, подписание и документы приведены к этому правилу. В More восстановлен пункт Administration → существующая служебная панель `#/more/demo`: роль, филиал, сеть, устройства и сценарии. Это исключение из прежнего скрытия входа; остальные рабочие экраны не меняются. Реальные интеграции и новая система прав доступа не добавлены.

## 2. Источники истины

Для AS-IS факта использовать код, тесты и migrations. Для TO-BE поведения использовать утверждённые product decisions. При расхождениях внутри одной категории действует следующий приоритет:

1. фактический код, тесты и SQL migrations — AS-IS;
2. [STAGE_0_PRODUCT_DECISIONS.md](STAGE_0_PRODUCT_DECISIONS.md) и [BOL_DECISION_LOG.md](../../BOL_DECISION_LOG.md) — утверждённый TO-BE baseline;
3. этот текущий срез;
4. [SYSTEM_ANALYSIS.md](SYSTEM_ANALYSIS.md), [ARCHITECTURE.md](ARCHITECTURE.md) и [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) как целевая модель;
5. [OWNER_DEMO_PLAN.md](OWNER_DEMO_PLAN.md) — текущий scope, нумерация и критерии demo-этапов 3–7; [WIREFRAME_IMPLEMENTATION_PLAN.md](../../WIREFRAME_IMPLEMENTATION_PLAN.md) — сводка плана и исторический каталог;
6. исходные ТЗ и audit-пакет как исторические источники требований.

Опубликованный baseline приложения в main: cdbd0bb от 2026-09-28. История: Этапы 3–4 — 1d2a2d2, Этапы 5–6 — 8756a6f, Этап 7 — 762ffb5, восстановленный вход Administration — 8f756a5, email-копия Pickup eBOL — 4f9b552, единый сайт приложения и документации — 0b14625, Customer SMS — 9b2dc6f/99acb2c/1d8c41e, Pre-trip inspection — 5d8e844, Delivery OTP — 97af773, OTP во всех Dropoff — cdbd0bb. Текущий source расширяет OTP на Pickup и исключает неподтверждённую выдачу: контакт использует только подпись на устройстве или SMS-код. Наличие кода в main не подтверждает бизнес-приёмку Этапа 7 owner. Комплект пользовательских документов на [английском](../mobile-app/README.md) и [русском](../mobile-app/ru/README.md) публикуется вместе с прототипом; внутренние Open Questions в публичный Git и Pages artifact не входят.

## 3. Что фактически реализовано

| Контур | Реализовано | Граница |
|---|---|---|
| Навигация | Home | Tasks | Scan | More, Cargo places, обязательный Pre-trip inspection и secondary Interstate | Часть legacy-экранов в src не подключена к App.tsx |
| Customer communications | Messages inbox с поиском и All/Unread, Order-thread для 7 mock-заказов, входы из Home/Tasks/Order details/Pickup draft, быстрые сообщения, корпоративный sender 17178361039, unread, date groups, offline queue, failure/retry и mock incoming reply; из диалога доступен визуальный исходящий звонок с состояниями ready/calling/connected/ended, Mute/Speaker и повтором | Только локальная управляемая демонстрация; реальная телефония, аудио, SMS API, webhook, push, delivery receipt, call history и missed calls отсутствуют |
| Pickup/Dropoff | Autosaved/restored Pickup draft, dimension group CRUD с индивидуальными PlaceID, заполненные route mock-заявки, history, Recent Operations edit и mock Dropoff reconcile | Только `localStorage`; нет реальных задач, камеры, файлов и server confirmation |
| Данные заказа | Trade/internal names, отдельный Qty, source, role-gated edit/audit, Special Cargo, read-only Spoke preview; известные итоги и причины неполных измерений | Локальные fixtures и permissions; Fragile/Oversized и role mapping — demo-допущения |
| CargoPlace | Prototype PlaceID, `n/N`, labels, current status/location и короткая история | Проекция вычисляется из mock/local state |
| Labels / Scan | All/selected/one, preview выбранных Code 128, version filter, mock print/reprint history, printer unavailable, valid/duplicate/unknown и manual lookup | Нет printer SDK или аппаратного scan; Print моделирует результат локально |
| Order eBOL/POD | Pickup/Delivery review; comments на шаге каждой стороны (локальное изменение), locked snapshots, Supplemental versions, read-only история документов, POD, Download/Print/Email/Share dialogs и необязательная email-копия подписанной версии Pickup | Подписи, PDF и отправка email не production/legal artifacts; результат локально имитируется |
| Фото | Отдельные mock-фото, категории, preview/filter/remove, восстановление Pickup/Delivery, фото своих версий в review/POD | Только metadata и существующие demo-assets; без файлов и upload |
| Предрейсовый осмотр | Gate перед дневным маршрутом, 8 safety/equipment-checks, 5 camera-only ракурса, attestation, блокировка при Issue и сохранение на устройстве | Hi-fi wireframe; без реальной камеры, vehicle assignment, supervisor override, ремонтных задач и server audit |
| Handoff OTP | Доступен во всех Pickup и Delivery/Dropoff: SMS на неизменяемый маскированный номер, 6 цифр, `111111` как ошибочный код, 3 попытки/отправки, expired/delivery error/offline/locked, затем подпись водителя и OTP marker в eBOL/POD | Hi-fi wireframe; Twilio Verify, регистрация sender/compliance, backend verification, audit и supervisor override отсутствуют. См. [DELIVERY_OTP_WIREFRAME.md](DELIVERY_OTP_WIREFRAME.md) |
| Interstate | Loading review, Trip, immutable loaded manifest в domain model, Unloading draft, BOL archive | Нет authoritative Trip service и atomic server Close |
| Scenario controls | Роль, филиал, сеть, sync/print/email/SMS outcomes, UI-контрол `Delivery OTP result`, который сейчас применяется к Pickup и Delivery OTP, mock incoming reply, camera/scanner/printer, normal/offline/conflict/OTP/40/100-photo presets, reset | Только управляемая демонстрация; название OTP-контрола уже его фактического scope |
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

Frontend source повторно проверен 2026-09-30: Vitest — 23 файла / 123 теста, TypeScript tsc -b, Vite build и VitePress docs build проходят. OTP rendered QA не выполнен: Playwright CLI отсутствует в текущем окружении. Messages ранее проверены в Chrome на 390×844 и 1440×1000: 7 threads, поиск, All/Unread, быстрые сообщения, offline, failure/retry, Order navigation и отправка до Sent. Вход Pickup draft → SMS → Order-thread дополнительно проверен на 430×1240 и 390×844; console содержит только известный необязательный favicon.ico 404. Ниже сохранены подробные результаты проверок этапов от 2026-09-02; backend-результаты остаются от 2026-09-01:

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

- rendered QA Этапа 5: comments/reload/storage-error recovery, разные подтверждённые версии, exception gate, POD и document actions — passed на 320/390/1440 px. [Детали](STAGE_5_EBOL_POD_DEMO.md). Этап принят owner.
- rendered QA Этапа 6: roles/names/audit/reload, Spoke preview, empty-name draft, nullable measurements/reason, согласованный Qty, frozen original/reprint, Supplemental — passed на 320/390/1440 px. [Детали](STAGE_6_ORDER_DATA_DEMO.md). Регрессии этапов 4–5 проходят; Этап 6 принят owner.

- rendered QA Этапа 7: два последовательных UI-only прогона 7/7, Reset/Cancel, 320/390/1440 px, защита order context/stale review/unsigned additions, отказ записи Delivery и успешный retry — passed. Регрессии этапов 5–6 проходят. [Инструкция и evidence](STAGE_7_OWNER_DEMO_REHEARSAL.md).

## 8. Следующий шаг wireframe

Провести с owner и операционной командой просмотр основных сценариев по [русскому руководству](../mobile-app/ru/user-guide.md) и [инструкции Этапа 7](STAGE_7_OWNER_DEMO_REHEARSAL.md). Зафиксировать «принято / изменить / вне scope» и принять решения по существенным внутренним открытым вопросам. Код Этапа 7 уже находится в `main`; отдельную бизнес-приёмку owner не заявлять без записи решения. Production integrations и полевой пилот не добавлять автоматически.

## 9. Отложенный production gate

Source-реализация `Create CargoPlace` описана в [STAGE_1_CREATE_CARGO_PLACE.md](STAGE_1_CREATE_CARGO_PLACE.md). После отдельного решения начать рабочее приложение нужно подтвердить её на PostgreSQL 16 test DB.

Готовый результат этапа:

1. поднята чистая PostgreSQL 16 БД с именем `*_test`;
2. `001_initial_schema.sql` применяется без ошибок;
3. integration test подтверждает atomic create, 3 события, outbox и точный replay;
4. отдельно добавляются проверки constraints, append-only triggers и optional RLS migration;
5. wireframe остаётся UX-reference и не подключается напрямую к PostgreSQL.

Production mobile shell/SQLite sync, BOL worker и реальный полевой пилот планируются отдельно. Это не является условием продолжения или приёмки owner-demo.
