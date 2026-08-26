# Системный анализ будущего приложения Zaberman Mobile

Дата: 2026-08-26  
Статус: baseline для согласования  
Аудитория: Product, Warehouse, Delivery, Dispatching, IT, разработка и QA

## 1. Вывод

Рекомендуется единое mobile-first приложение с двумя операционными контурами:

1. основной: `Pickup → Order eBOL → Dropoff → POD`;
2. дополнительный: `Interstate Trip → Loading → Interstate BOL → Unloading`.

Общая единица учёта — физическое грузовое место `CargoPlace` с глобальным `PlaceID`. Все изменения фиксируются неизменяемыми событиями, а текущий статус вычисляется из подтверждённых событий. Мобильный клиент работает local-first: немедленно сохраняет операцию на устройстве, синхронизирует её по `operationId` и показывает разницу между локальным и серверным состоянием.

Production-реализацию не следует строить поверх `localStorage`, Google Sheets row numbers или прямого доступа клиента к Apps Script. Минимальная целевая схема: React Native/Expo + SQLite + backend API + PostgreSQL + object storage + BOL worker.

## 2. Цель, пользователь и минимальный готовый результат

### Цель

Снизить ошибки и повторный ввод в складских и delivery-операциях, обеспечить сквозную идентификацию каждого места, работу при нестабильной сети и доказуемую историю передачи груза и документов.

### Основные пользователи

- warehouse employee — приём, измерение, упаковка, labels, Loading/Unloading;
- driver и delivery crew — Pickup/Dropoff, evidence и handoff;
- crew lead — проверка evidence и исключений;
- supervisor — подтверждение partial/exception/override;
- dispatcher — назначение задач, RouteRun, Trip, vehicle и monitoring;
- administrator — пользователи, permissions, devices и справочники.

### Минимальный production-ready результат

Вертикальный сценарий считается готовым, когда пользователь может:

1. безопасно войти и получить назначенную задачу;
2. работать с ней после потери сети;
3. создать или отсканировать места;
4. сохранить размеры, вес, фото и исключения;
5. завершить операцию локально и получить однозначный sync status;
6. повторить синхронизацию без дублей;
7. увидеть серверное подтверждение и историю каждого места;
8. восстановить незавершённый сценарий после перезапуска приложения.

## 3. Текущее состояние репозитория

### 3.1 Артефакты

| Артефакт | Состояние | Назначение |
|---|---|---|
| `ТЗ мобильного приложения.docx` | Источник TO-BE требований | Единое приложение, offline, data, BOL, UX и критерии epic |
| `Техническое задание на реализацию Loading Bot TG.docx` | Источник требований прежнего канала | Pickup/Delivery capture, фотографии, BOL и Kommo через Telegram-сообщение |
| `zaberman-mobile-app-audit/` | AS-IS snapshot от 2026-08-16 | Подтверждённые правила прежнего Loading Control/BOL и риски |
| `WIREFRAME_IMPLEMENTATION_PLAN.md` | Product/UX baseline | Целевая терминология, процессы, роли, offline и карта экранов |
| `BOL_DECISION_LOG.md` | Журнал решений | Разделение Order eBOL, Interstate BOL и POD |
| `wireframe/` | Активный интерактивный web-прототип | Согласование интерфейса и части бизнес-правил |

Важно: исходный production-код Warehouse Apps Script и BOL Generator, описанный audit-пакетом, в текущем checkout отсутствует. Поэтому его текущее production-состояние повторно не подтверждено.

### 3.2 Что реализовано в активном wireframe

- Home с быстрым входом в Pickup/Dropoff и mock-импортом маршрута Spoke;
- Pickup capture: заказ, филиалы, вес, группы размеров, упаковка, комментарий и количество фото;
- автоматический расчёт количества мест и объёма;
- стабильные prototype Place IDs `ZB-{ORDER_NUMBER}-{NN}`;
- Code 128 labels и browser print;
- Order eBOL: Pickup/Delivery evidence, contact/contactless, подпись водителя, locked snapshots;
- POD как представление завершённого Order eBOL;
- Interstate: направление, truck, выбор и ввод Place ID, review, Trip, unloading draft и архив Interstate BOL;
- mock offline/pending через `localStorage` и `navigator.onLine`;
- GitHub Pages deployment;
- 11 test-файлов, 28 тестов; на 2026-08-26 все тесты и TypeScript-проверка проходят.

### 3.3 Что отсутствует или только имитируется

- login, реальная identity и server-side permissions;
- backend API, централизованная БД и транзакции;
- реальная интеграция со Spoke, Kommo, Telegram, Apps Script, Sheets или Drive;
- камера, физический scanner, printer SDK и сохранение реальных фотографий;
- SQLite, outbox/inbox, background sync и конфликты между устройствами;
- Sync Center, audit timeline и discrepancy lifecycle;
- production PDF, legally binding signature, BOL correction/void/versioning;
- server-generated TripID/PlaceID и authoritative manifest;
- observability, backup, retention, privacy и disaster recovery.

Активная навигация унифицирована как `Home | Tasks | Scan | More`: Tasks использует модель Spoke и ведёт в рабочие Pickup/Dropoff routes, Scan открывает активный Pickup flow, Interstate доступен из More. В `src` всё ещё остаются дублирующие legacy-экраны и `DemoProvider`, не подключённые к активному `App.tsx`; их следует считать prototype debt.

### 3.4 Оценка зрелости

| Область | Уровень | Комментарий |
|---|---|---|
| Product terminology | Средний/высокий | Order eBOL, Interstate BOL и POD разделены |
| UX happy path | Средний | Основные prototype flows кликабельны |
| Domain rules | Средний | Есть тестируемые расчёты и lifecycle guards |
| Offline-first | Низкий | Только `localStorage` и mock sync |
| Security | Отсутствует | Нет production identity/authz |
| Data integrity | Низкий | Нет серверных constraints, versions и idempotency |
| Integrations | Отсутствуют | Только fixtures и имитация задержек |
| Operations/monitoring | Отсутствуют | Нет логов, metrics, alerting и support tools |
| Production readiness | Низкий | Wireframe не предназначен для production |

## 4. Scope целевой системы

### В MVP

- authentication и permission scope по филиалу/назначению;
- назначенные Pickup/Dropoff tasks;
- Order, CargoItem и CargoPlace;
- размеры, источник веса, упаковка, фото и damage evidence;
- offline-safe PlaceID и label;
- scan/manual fallback;
- local draft, durable outbox, retry и visible sync state;
- Pickup/Dropoff completion и append-only history;
- Order eBOL snapshots и POD preview/PDF после утверждения юридических правил;
- минимальный supervisor review исключений;
- интеграция с master Order/Task system.

### Следующий инкремент

- Interstate Trip master и versioned manifest;
- scan-first Loading/Unloading;
- missing/extra/damaged discrepancy lifecycle;
- server-confirmed atomic Close;
- Interstate BOL preflight, generation, registry и версии;
- расширенная интеграция с existing Loading/BOL на переходный период.

### Вне первого production-инкремента

- полноценная desktop admin/dispatching система;
- сложная route optimization;
- платежи;
- GS1-совместимость без подтверждённой внешней потребности;
- микросервисное разделение;
- прямая печать на каждый тип принтера без пилота оборудования;
- автоматическое исправление фактических данных без пользователя/причины.

Допущение: локальный Pickup/Dropoff — основной ежедневный поток. Если бизнес подтвердит, что наибольший текущий ущерб создают interstate ошибки, порядок двух вертикальных инкрементов можно поменять, не меняя общую платформу Place/Event/Sync.

## 5. Ключевые бизнес-правила

1. `CargoPlace` всегда связан с `Order`, но не обязан быть связан с Interstate Trip.
2. Pickup и Dropoff — самостоятельные операции; Same Day связывает их через `RouteRun`, но не превращает в одну операцию.
3. Trip создаётся до Loading и имеет уникальный server ID, route, truck и expected manifest version.
4. Confirmed loading manifest содержит только фактически подтверждённые места.
5. Unloading сверяется с confirmed loading manifest, а не с исходным планом заказа.
6. Duplicate `operationId` возвращает исходный результат и не создаёт второе событие.
7. Wrong-trip/unknown code не меняет прогресс без supervisor decision.
8. Missing создаётся после явного review/Close, а не после каждого непросканированного места.
9. Damage не обязан блокировать передачу, но требует evidence и note согласно политике.
10. Offline Close создаёт `ready_to_close`; окончательный `closed` устанавливает только сервер.
11. Текущий статус места — projection; `PlaceEvent` не редактируется и не удаляется обычным workflow.
12. BOL failure не откатывает warehouse fact.
13. BOL формируется по immutable manifest/snapshot version и фактическим totals выбранных places.
14. Исправление подписанного или issued документа создаёт новую версию/корректирующую операцию; прежняя версия сохраняется.
15. Фото и PDF хранятся в object storage; БД хранит metadata, checksum, связь и lifecycle.

## 6. Основные процессы TO-BE

### Pickup

`Assigned task → Arrived → Reconcile plan/fact → Create places → Measure/weight → Photos/issues → Label/scan test → Review → Complete/Partial/Refused → Sync → Server confirmed`

Критичные исключения: extra item, unknown weight/dimensions, damage, partial/refused, no printer, label replacement, repeat Pickup, offline completion.

### Dropoff

`Assigned task → Load expected Pickup snapshot → Scan handoff → Evidence/issues → Recipient confirmation → Review → Complete/Partial/Refused → Sync → POD`

Критичные исключения: missing, extra, duplicate, unknown code, new damage, recipient refused, Pickup not yet reconciled.

### Interstate Loading

`Assigned Trip → Cached expected manifest → Scan loop → Local LoadEvents → Reconcile → Supervisor review if partial/issues → Server Close → Immutable manifest version → BOL request`

### Interstate Unloading

`Arriving Trip → Confirmed manifest → Scan loop → Local UnloadEvents → Damage/extra → Review unreceived → Server transaction: close + discrepancies + locations → Confirmed`

### BOL

`Generation request → Preflight → Queue → Render PDF → Registry/version → Issue/sign/archive or retry/fail`

## 7. Роли и permissions

Рекомендуется `permissions + scope`, а не одна жёсткая роль.

| Capability | Worker/Crew | Driver | Supervisor | Dispatcher | Admin |
|---|---:|---:|---:|---:|---:|
| Выполнить назначенный Pickup/Dropoff | Да | По crew permission | Да/override | Нет | Нет |
| Создать/изменить place до completion | Да | Нет | Да | Read-only | Support |
| Сканировать Loading/Unloading | Warehouse scope | Опционально | Да | Read-only | Нет |
| Подтвердить partial/issues Close | Запрос | Нет | Да | По политике | Нет |
| Создать RouteRun/Trip и назначить vehicle | Нет | Нет | Ограниченно | Да | Справочники |
| Resolve discrepancy | Нет | Нет | Да | Да | Нет |
| Generate/Retry BOL | Request/View | View | Да | Да | Support retry |
| Void/Issue/Archive BOL | Нет | Нет | По политике | Да | Нет |
| Управлять users/devices | Нет | Нет | Нет | Нет | Да |

Каждая mutation проверяет permission и scope на сервере. Client-side hide/disable — только UX, не защита.

## 8. Данные и source of truth

| Объект | Целевой master | Ключевые потребители | Переходное правило |
|---|---|---|---|
| Order и Task | Корпоративный Order/Dispatch system, требуется подтверждение | Mobile, operations | Mobile cache read-only для плановых полей |
| CargoPlace | Zaberman operational DB | Mobile, Trip, BOL, CRM | Не создавать второй master в Sheets |
| RouteRun | Dispatch/route system | Mobile | Spoke adapter, если Spoke утверждён master |
| Trip/Manifest | Zaberman operational DB или утверждённый TMS | Mobile, BOL | Apps Script/Sheets только adapter в migration |
| PlaceEvent | Zaberman operational DB | Status projections, audit | Append-only, source `operationId` unique |
| Media | Object storage + metadata DB | Mobile, documents, support | Telegram `file_id` импортировать как external reference |
| Order eBOL/POD | Document module | Mobile, customer/support | Snapshot version immutable после подтверждения |
| Interstate BOL | BOL module | Trip, operations | Старый generator может временно быть downstream consumer |
| User/permissions | Corporate IdP + app authorization DB | Все компоненты | Plaintext Sheets passwords запрещены |

## 9. Offline и синхронизация

### Модель

- SQLite хранит cached entities, drafts, outbox operations и sync checkpoints.
- Каждая mutation создаётся локально с `operationId` (UUID), `occurredAt`, `deviceId`, `userId`, `entityVersion` и payload.
- UI немедленно показывает локальный результат со статусом `saved_on_device`.
- Sync Engine отправляет outbox в порядке зависимостей и повторяет transient failures с backoff.
- Сервер сохраняет `operationId` под unique constraint и возвращает прежний результат при повторе.
- Серверный event/result попадает в inbox и обновляет local projection.
- Business conflict не ретраится бесконечно; он получает `needs_review` и объяснимый resolution flow.

### Обязательные пользовательские состояния

`saved_on_device`, `waiting_for_connection`, `syncing`, `synced`, `retry_scheduled`, `needs_review`, `rejected`.

### Ограничение платформ

Фоновая задача мобильной ОС запускается не по точному расписанию и может не выполниться после принудительного закрытия приложения. Поэтому sync должен запускаться также при старте, возвращении в foreground, восстановлении сети и ручном `Sync now`; критичный Close не должен зависеть только от background execution.

## 10. Нефункциональные требования

Числа ниже — рекомендуемый baseline; их нужно подтвердить данными пилота.

| Категория | Baseline |
|---|---|
| Local response | Результат scan и локального сохранения до 300 мс на поддерживаемом устройстве |
| Startup | Cached task list доступен до 3 секунд без сети |
| API | p95 обычной mutation до 1 секунды без учёта media upload |
| Reliability | Ни одна подтверждённая локальная операция не теряется при crash/restart |
| Idempotency | Повтор одного `operationId` не меняет бизнес-результат |
| Availability | Целевой API baseline 99.5% в месяц; offline workflow снижает операционную зависимость |
| Scalability | Индексы и pagination; без полного чтения таблиц/листов на каждый запрос |
| Security | OIDC/OAuth2, short-lived access token, secure refresh token, TLS, encryption at rest |
| Audit | user, device, occurredAt, receivedAt, operationId, reason и result для каждой mutation |
| Accessibility | Touch targets не менее 44×44 pt, 200% text zoom, color-independent statuses |
| Time | Хранить UTC; показывать timezone операции/warehouse; не извлекать дату из ID |
| Files | Checksum, MIME/type validation, size limits, resumable retry, malware policy |
| Recovery | Автоматические backup и регулярно проверяемое восстановление PostgreSQL/object storage |

Retention для photos, signatures, POD/BOL и audit events должен быть утверждён Legal/Operations до production.

## 11. Безопасность и privacy

- первый login требует сеть; offline разрешён только ранее авторизованному устройству в ограниченном TTL;
- refresh token хранится в secure storage, не в обычной SQLite/localStorage;
- разрешения проверяются сервером на каждом запросе;
- device registration и remote revoke обязательны для корпоративных устройств;
- PII и фотографии не попадают в application logs;
- signed URL на файлы имеет короткий TTL и scope;
- upload проходит type/size/checksum validation;
- append-only audit отделён от изменяемых business projections;
- export/share документов ограничен permission и фиксируется в журнале;
- секреты и connection strings хранятся в secrets manager, а не в репозитории;
- production и test данные/бакеты разделены.

## 12. Основные разрывы текущего прототипа

| Приоритет | Разрыв | Риск | Решение |
|---|---|---|---|
| P0 | Не определён master Order/Task/Trip | Dual write и расхождение фактов | Утвердить ownership и direction of exchange |
| P0 | Нет production identity/permissions | Несанкционированные операции | IdP + server-side scope |
| P0 | Нет глобального PlaceID policy | Дубли и потеря chain of custody | UUID-based PlaceID, unique constraints, label aliases |
| P0 | Offline Close/conflict policy не утверждены | Ложный closed, потеря событий | Ready-to-close + server transaction + review |
| P0 | Юридические правила подписи/eBOL не утверждены | Недействительный документ | Legal/business decision до production signing |
| P1 | Вес в prototype равномерно распределяется по places | Неточный partial BOL | Actual/declared place weight или явное allocation rule |
| P1 | Photos представлены счётчиком | Нет evidence/file lifecycle | Local files + object storage metadata |
| P1 | Interstate generated state частично живёт только в memory | Потеря после reload | SQLite + server state |
| P1 | Нет discrepancy owner/SLA | Открытые проблемы не закрываются | Lifecycle, assignment, aging и escalation |
| P1 | Нет migration/dual-run policy | Несогласованные старые и новые системы | Object-level single writer и reconciliation |
| P2 | В `src` есть недоступный старый UI-контур | Путаница и лишняя поддержка | Удалить после подтверждения, отдельным change |

## 13. Риски

1. **Scope risk:** попытка включить одновременно все роли, два eBOL, interstate, offline, printers и integrations задержит MVP. Нужен один vertical slice.
2. **Data ownership risk:** без master matrix новое приложение станет ещё одним источником расхождений.
3. **Offline risk:** background sync нельзя считать гарантированным; пользователь должен видеть pending/rejected.
4. **Hardware risk:** camera и system print не гарантируют работу с конкретными warehouse scanners/printers; обязателен device pilot.
5. **Legal risk:** mock signature не равна юридически значимой e-signature.
6. **Migration risk:** dual write в Sheets и новую БД без idempotency/reconciliation создаст дубли.
7. **Operational risk:** BOL/media queues требуют owner, dashboard, retry и alerting.
8. **Audit risk:** mutable status без событий не доказывает chain of custody.
9. **Security risk:** перенос anonymous Apps Script/plaintext password недопустим.
10. **Performance risk:** списки и manifests нельзя загружать целиком по модели старых Sheets.

## 14. Рекомендуемая последовательность

### Этап 0. Решения и technical spikes

- утвердить master systems, роли, PlaceID/label, BOL/signature policy, retention и device list;
- проверить камеру, Code 128/QR и 1–2 реальных принтера на iOS/Android;
- доказать offline outbox/idempotency/conflict на одном CargoPlace event;
- зафиксировать ADR и API/data contracts.

### Этап 1. Платформенная основа

- app shell, identity, permissions и device registration;
- SQLite schema, outbox/inbox, sync status и observability;
- backend modular monolith, PostgreSQL, object storage и media upload;
- Order/Task adapter и read-only cached assignments.

### Этап 2. Pickup/Dropoff vertical slice

- places, measurements, labels, photos, exceptions;
- Pickup/Dropoff completion и history;
- Order eBOL snapshots/POD в согласованном объёме;
- pilot одной команды/филиала и измерение времени/ошибок.

### Этап 3. Interstate и BOL

- Trip/manifest, Loading/Unloading, partial/missing/extra/damage;
- atomic Close и discrepancy lifecycle;
- BOL worker, registry, versioning, retry и support dashboard.

### Этап 4. Migration и hardening

- controlled dual-run, reconciliation и cutover;
- performance/security/DR testing;
- rollout по филиалам, training и support runbooks.

## 15. Критерии готовности к разработке

- закрыты P0-решения и назначены владельцы P1;
- утверждены context/container/data diagrams;
- есть source-of-truth matrix по объектам и полям;
- есть versioned OpenAPI и event schemas;
- описаны offline, retry, conflict и server confirmation;
- определены supported devices/scanners/printers;
- согласованы фото, BOL/eBOL, signature и retention;
- выбран один MVP vertical slice и измеримые acceptance criteria;
- подготовлены test data, migration approach и rollback;
- Product, Warehouse, Delivery, Dispatching, IT и Security подтвердили baseline.

## 16. Проверка отчёта

- Прочитаны оба DOCX структурно; визуальный DOCX-render не выполнен, так как LibreOffice отсутствует в локальной среде.
- Сопоставлены audit-пакет, implementation plan, decision log и активный router/domain/store код.
- Unit tests: 11 файлов, 28 тестов — passed.
- TypeScript `--noEmit` — passed.
- Production integrations и живые данные не проверялись и не изменялись.
