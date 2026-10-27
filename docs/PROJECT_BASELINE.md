# Project baseline

Дата фиксации: **2026-10-16**. Пользователи документа: аналитик, Product, разработчики и QA. Назначение: однозначно определить исходную базу для подготовки ТЗ, архитектуры и плана разработки без изменения продукта.

## Project status

**Prototype approved by CEO.** Основание — прямое подтверждение owner в задаче синхронизации от 2026-10-16. Утверждены текущие UI/UX и реализованная логика прототипа. Следующий этап — подготовка документации для передачи разработке. Отдельные старые отметки «приёмка этапа 7 не подтверждена» описывают прежний срез, а не текущий статус.

Проверяемая исходная ревизия: `1abe03ce0cd54697dedf713a0657c5f41f69ece3`. На старте три barcode-файла в `docs/system-report/` были untracked; они учтены как локальные research-материалы, не как часть этого commit. Аудит и новые документы ещё не являются отдельной Git-ревизией. Удалённый deploy в этой задаче не проверялся.

Не утверждены этим подтверждением: окончательный production-стек/backend, поставщики интеграций, полный production scope, SLA, безопасность, юридическая сила подписей, миграция, бюджет и сроки. Ранее принятые продуктовые решения сохранены в [реестре](decisions/DECISION_LOG.md); рекомендации и неизвестные решения отделены от них.

## Уточнение целевого Release 1 после согласования

Owner согласовал 12 BD и отложил 3; актуальные ответы и остатки всех 15 OQ — [Release 1 decisions](requirements/RELEASE_1_DECISIONS.md). Ядро: Pickup/Dropoff, фото/размеры и комментарий при недоступных данных, подписи и PDF, Spoke API route, offline-friendly сохранность, полный доступ зарегистрированному пользователю, iPhone/iPad. Branch=Warehouse; dispatcher/Same Day orchestration вне app; Interstate позднее. Backend/API/NFR параметры не утверждены. Подготовлены [архитектурный draft](architecture/SYSTEM_ARCHITECTURE_AND_INTEGRATIONS.md) и [план зависимостей](requirements/DEVELOPMENT_PLAN.md).

Ниже **AS-IS утверждённого прототипа**: scope/навигация/локальные gates не изменены. Их отличия от уточнённых target требований фиксируются в Gap Analysis; фактическая готовность live сервисов не повысилась от изменения документов.

## Current application scope

| Контур | Текущее поведение | Источник |
|---|---|---|
| Home / Tasks | Маршрут Spoke из fixtures, остановки Pickup/Dropoff, поиск/фильтры, manual operations, drafts, recent operations, документы | `CargoHomeScreen`, `TasksScreen`, `cargoStore`, `spokeDomain` |
| Осмотры | Обязательный Pre-trip перед загрузкой дневного маршрута: 8 checks, 5 фото-маркеров, attestation; Issue блокирует. Post-trip: дефекты с описанием, отчёт без такого блокирования, история пар, новый цикл с новым Pre-trip | `preTripInspectionDomain`, `postTripInspectionDomain`, `preTripInspectionStore` |
| Pickup | Autosave/restore, dimension groups (Qty, L/W/H, вес места), индивидуальные PlaceID, история, упаковка, фото; неизвестные измерения с reason перед review. Original после подписания read-only; дополнительные места — Supplemental с новой версией | `PickupCaptureScreen`, `pickupDraftDomain`, `orderEbolDomain` |
| Dropoff | Поиск Order, сверка Pickup evidence, фото Delivery, match и condition/exception, защита от неподписанного Supplemental; Delivery review и подтверждения завершают eBOL | `DropoffVerifyScreen`, `DeliveryEbolScreen`, `DeliverySignatureScreen` |
| Local / Same Day | Pickup и Dropoff — отдельные операции. Local доступен через обычные задачи. Same Day через RouteRun — принятая концепция; отдельного активного flow, автоматической пары и общего completed нет | `App.tsx`, `domain.ts`, [бизнес-обзор](mobile-app/ru/business-overview.md) |
| Order details | External/internal name, Qty, Special Cargo, source/Spoke preview, Requirements из broker fixtures, Team contacts, Order note. Локальные role-gates, audit, map/copy | `OrderDetailsScreen`, `orderDetailsDomain`, `orderRequirements`, `teamContactsDomain` |
| eBOL / POD | Order eBOL на заказ; Pickup/Delivery snapshots, комментарий каждой стороны на её шаге, контакт: device signature или проверенный OTP, водитель: подпись; locked versions и Supplemental. POD — итоговое представление completed eBOL | `orderEbolDomain`, `OrderDocumentHistory`, `OrderDocumentActions` |
| Документы | Preview/version history, действия Download/Print/Email/Share; необязательная email-копия подписанной версии Pickup. Order-действия моделируют результат, не создают настоящий PDF/отправку | `orderDocumentDomain`, `documentEmailStore` |
| Фото / offline | Фото-ID, категории, фильтр/preview/remove, раздельное evidence версий; локальная очередь retry/conflict, Keep local changes, состояния offline/slow/error | `photoEvidenceDomain`, `useEvidenceSync`, `prototypeScenarioStore` |
| Cargo / labels / Scan | Проекция отдельного места и событий; Code 128, `ZB-{ORDER}-{NN}`, печать all/selected/one, reprint/history. Общий Scan — lookup, а Loading/Unloading отмечают места внутри операции; duplicate/unknown и ручной ввод | `cargoDomain`, `cargoPlaceTracking`, `placeLabelsDomain`, `placeScanDomain` |
| Interstate | Выбор origin/destination и truck → подходящие Pickup records → выбор/ввод PlaceID → review loaded manifest → Create Trip & BOL; отдельные incoming fixtures → receive → review missing → Confirm unloading; поиск/архив BOL | `interstateDomain`, `interstateStore`, активные Interstate screens |
| Communications | Inbox → Messages / Calls, индикаторы unread/new missed, поиск и Missed, дата маршрута отдельно от звонка, order thread/quick texts/offline queue/retry, Call back и локальная история исходящих, Mute/Speaker. [Инкремент 2026-10-27](requirements/INBOX_CALLS_INCREMENT_2026_10_27.md). Настоящих SMS, звонков и аудио нет | `communicationDomain`, `callDomain`, `communicationStore` |
| Administration | Роль, филиал, сеть, устройства, outcomes, presets/reset; отдельный служебный маршрут и вход из More | `PrototypeControlsScreen`, AGENTS.md |

Все указанные модули находятся в `wireframe/src/`. Подробные пользовательские правила: [RU guide](mobile-app/ru/user-guide.md), [EN guide](mobile-app/user-guide.md). Старые `HomeScreen`, `PickupScreen`, `DropoffScreen`, `OperationsScreen`, `SameDayScreen` не подключены к активному router; их наличие не расширяет утверждённый пользовательский сценарий.

Объём: Σ(Qty × L × W × H) / 1728, in³ → cu ft; неполные L/W/H исключены из известных итогов и показываются как incomplete. Вес группы с заданным весом места: Qty × weight/place; в legacy fixtures встречается распределение общего веса. Контроль: 3 × 24 × 24 × 36 / 1728 = 36.00 cu ft; 3 × 18 = 54 lb. Источник: `cargoDomain.ts`, `measurementDomain.ts`, `pickupGroups.test.ts`.

## Current navigation

Активные пути ниже указаны после `#` (`HashRouter`). Источник: [App.tsx](../wireframe/src/App.tsx). Нижнее меню: **Home | Tasks | Scan | Inbox | More** (COM-001, 2026-10-27).

| Путь / группа | Экран и переходы |
|---|---|
| `/`, `/tasks`, `/scan`, `/more` | Home, Tasks, lookup, дополнительные действия |
| `/pre-trip-inspection`, `/post-trip-inspection` | Осмотры и история цикла |
| `/pickup`, `/dropoff` | Запись Pickup и сверка Dropoff; контекст заказа передаётся в переходах/query |
| `/orders/:orderNumber/details` | Сведения и контакты заказа |
| `/orders/:orderNumber/labels` | Этикетки мест |
| `/orders/:orderNumber/ebol/pickup`, `.../pickup/sign` | Pickup review/locked и signing |
| `/orders/:orderNumber/ebol/delivery`, `.../delivery/sign` | Delivery review и signing |
| `/orders/:orderNumber/ebol/pod`, `.../documents/:documentKey` | POD и конкретная версия документа |
| `/communications`, `/orders/:orderNumber/communications`, `/orders/:orderNumber/call` | Inbox, order thread, звонок |
| `/places`, `/places/:placeId` | Список и карточка места |
| `/interstate`, `/interstate/loading`, `/interstate/review`, `/interstate/trip` | Направление/машина, загрузка, review, созданный рейс |
| `/interstate/unloading/:tripId` | Приёмка входящего manifest |
| `/interstate/bols`, `/interstate/bol`, `/interstate/bol/:bolNumber` | Архив и BOL |
| `/more/demo` | Administration |
| Любой неизвестный путь | Redirect на Home |

Отдельных активных маршрутов login, Same Day, RouteRun detail, sync queue, permissions management нет. Help & Instructions открывает собираемый сайт `/Mobile_app/help/`.

## Current domain model

Это словарь понятий и связей, не новая схема БД.

| Понятие | Связи и граница |
|---|---|
| Order / OrderDetails | Номер объединяет операции, CargoRecord, документы, контакты и переписку. Отдельного production Order service нет |
| Task / Stop | Назначенная остановка Pickup или Dropoff с Order, временем, адресом и порядком. Stop в UI не означает отдельный реализованный агрегат |
| RouteRun | Принятый контекст связи local/Same Day операций; в старом `Task` есть optional `routeRunId`, полноценный lifecycle не реализован |
| Pickup / Delivery | Раздельные drafts/evidence; Pickup original и Supplemental принадлежат одному Order, Delivery сверяется с подтверждёнными материалами |
| CargoRecord / DimensionGroup / CargoPlace | Запись заказа содержит группы одинаковых измерений; Qty раскрывается в отдельные PlaceID; номер `n/N` — представление, не отдельная сущность |
| Branch / Warehouse / Direction | В прототипе общий справочник `NJ1, CA1, CA2, TX1, FL1, AL1`; origin/destination задают направление. Разделение Branch и Warehouse в production требует уточнения |
| Vehicle / Truck / Driver / User | Машина в осмотре и список truck в Interstate — fixtures; signer/responsible и переключаемая роль — локальный контекст, не identity/assignment services |
| Inspection / cycle | Pre-trip и Post-trip с checks, фото-маркерами и подтверждением; не система учёта смен |
| Interstate Trip / manifest | Направление, truck и snapshot выбранных загруженных мест; incoming Trip fixtures имеют собственный manifest. Unloading сверяет именно manifest |
| Order eBOL / snapshots / version | Документ заказа, раздельные Pickup/Delivery evidence и confirmations; original/Supplemental версии сохраняют свой состав |
| POD / Interstate BOL | POD — итоговый вид eBOL; Interstate BOL относится к Trip/manifest и не заменяет eBOL |
| Photo / Confirmation / Label / Print attempt | Фото metadata связаны с evidence; подписи/OTP — локальные markers; label связан с PlaceID, повторная печать сохраняет его |
| Communication / Sync item / place event | Локальные сообщения, результаты синхронизации и проекция истории; не authoritative серверный журнал |

`movement_type`: Stage 0 закрепляет Order-owned `local_standard`, `local_same_day`, `interstate`, `interbranch_transfer`, а Task/RouteRun — projections. В wireframe `Task.movementType` объявлен в `domain.ts`, но `CargoRecord` не имеет канонического `movement_type`, Interstate eligibility проверяет status + origin/destination. Поэтому наличие enum не означает реализацию production policy. SQL POC содержит Order-owned поле. Это зафиксированное расхождение уровней реализации, не основание менять модель в данной задаче.

Историческая матрица NJ1 ↔ CA1 / CA2 уже фактического selector шести складов: UI допускает любые разные origin/destination. Возможность выбора CA1 → CA2 не утверждает production interbranch workflow. Совпадающие склады не выбираются в Interstate; Same Day нельзя выводить только из равенства Branch.

## Systems and data flow

| Компонент / связь | Фактическое состояние |
|---|---|
| React/Vite → browser localStorage | Рабочий контур прототипа: fixtures + изменения в ключах `zaberman-*`, локальные projections и queues |
| Markdown → prepare-docs → VitePress → `wireframe/dist/help` | Рабочая сборка пользовательской документации RU/EN; публикация Pages настроена в `.github/workflows/deploy-pages.yml` |
| Navigate / Copy address / Interstate BOL print | Внешняя ссылка Google Maps, clipboard и browser print; это браузерные действия, а не серверные интеграции |
| `backend/` → PostgreSQL | Отдельный NestJS Create CargoPlace POC: validation, dev context, authorization check, transaction/idempotency/events/outbox. Прототип его не вызывает |
| `database/postgres/` | DDL двух migrations, не доказательство развёрнутой БД. Runtime integration test в текущем аудите skipped |
| Spoke / Order-Dispatch master / Kommo / Telegram / legacy Loading/BOL | Источники контекста и будущие integration boundaries. Нет рабочего обмена из текущего прототипа |
| SMS/OTP/email/PDF/media/IdP/printer/scanner | Реальные сервисы/SDK к прототипу не подключены; поставщики, contracts и эксплуатационные условия не финализированы |

Будущее ownership по PD-014 сохраняется как принятое продуктовое правило: плановые Order/Task/RouteRun — внешний master, операционные факты — Zaberman, документы — документный контур. Конкретный system of record по каждому полю/API ещё требуется специфицировать. React Native/Expo, SQLite, S3 и прочая схема из старых архитектурных документов — рекомендации, не текущие компоненты приложения и не новый архитектурный выбор аудита.

## Known constraints

- Browser prototype, без production mobile client, auth/RBAC, server sync и multi-device concurrency. Переключаемые роли: `warehouse`, `driver`, `delivery`, `supervisor`, `dispatcher`, `admin`; реальные capabilities не выводятся из видимости кнопок. Supervisor → crew lead и Fragile/Oversized — прежние demo-допущения.
- Offline-friendly показан для уже загруженного приложения: localStorage, очередь, retry/conflict. Не доказаны cold start offline, durable media, background sync, SQLite/outbox и безопасное разрешение серверных конфликтов.
- Фото используют общий mock asset/metadata, а осмотры — фото-маркеры; рисунок подписи не становится production asset. OTP, PDF, print/email/SMS outcomes — моделирование; Interstate BOL использует browser print.
- Unloading использует входящие fixtures; полный переход созданный исходящий Trip → входящий Trip → финальная Delivery не соединён автоматически.
- Политики hardware, retention, security, legal/compliance, source master и deployment не определены окончательно. PostgreSQL POC не подтверждён runtime migration/RLS проверками.
- В пользовательском UI сохраняются обычные продуктовые названия Print/Scan и статусы; технические ограничения документируются здесь, служебные сценарии — Administration. UI не менялся при синхронизации.
- Исходные DOCX и legacy audit ignored в Git; локально существуют, но не доступны при clean clone. См. риски передачи в [аудите](current/REPOSITORY_AUDIT.md).

## Open Questions

Ниже исходные составные вопросы аудита. Они не являются текущим списком «всё ожидает ответа»: согласованные части и оставшиеся gates для каждого OQ перечислены в [актуальном срезе](requirements/RELEASE_1_DECISIONS.md#остатки-всех-15-oq). Предлагаемый участник не является назначенным владельцем.

| ID | Недостающее решение | Для следующего этапа / участники |
|---|---|---|
| OQ-01 | Production MVP: какие из ранее описанных целевых сценариев входят; Same Day pairing/assignment/cancel и lifecycle RouteRun | ТЗ / Product, Operations, Dispatch |
| OQ-02 | Interbranch CA1 ↔ CA2 и остальные направления шести Branch: допустимые movement types, Loading/Unloading и документы; Branch vs Warehouse | ТЗ / Operations |
| OQ-03 | Конкретные masters Order/Task/RouteRun/Trip/Vehicle, immutable external IDs и mapping `movement_type`/`service_type`/Spoke IDs | Архитектура и интеграции / Product, IT |
| OQ-04 | Недостающие/лишние/неверные места, partial handoff, refused, повреждения, correction/void/override; переход Interstate → Delivery | ТЗ / Operations |
| OQ-05 | Минимальные photo evidence по типу операции/груза, ракурсы, качество, media sizes, retention/delete/access | ТЗ и хранение / Operations, IT |
| OQ-06 | Capability/assignment/branch policies, identity provider, offline session, signature delegation; не переносить demo-role mapping автоматически | Архитектура / Product, IT |
| OQ-07 | Online/offline матрица, окончательная server-confirmation, sync protocol/merge, TTL/cache, conflicts между устройствами, recovery | ТЗ и архитектура / Product, IT |
| OQ-08 | Legal wording, OTP verification/audit, checkpoint фиксации evidence/lock, numbering/versioning, correction/void, delivery recipients/channels и retention документов | ТЗ и интеграции / Product, уполномоченные legal/IT |
| OQ-09 | Code 128/QR policy и backward compatibility, label replacement, supported iOS/Android/printer/scanner matrix и fallback | Интеграции / Operations, IT |
| OQ-10 | Production stack, deployment, environments, NFR/SLA, observability/security/backup; степень переиспользования POC и runtime SQL validation | Архитектура / IT, разработка |
| OQ-11 | SMS/call/email vendors, corporate sender ownership, webhooks/push, retry/delivery receipts и communications retention | Интеграции / Product, IT |
| OQ-12 | Vehicle assignment, pre-trip Issue escalation/override/repair и применение осмотров за пределами показанного route gate | ТЗ / Operations |
| OQ-13 | Пересечение отдельного barcode-проекта и Mobile App: будущая интеграция, IDs, источники и ownership; его Sheets/iOS-first scope не переносить автоматически | Межпроектное решение / owner, IT |
| OQ-14 | Передача локальных ignored DOCX/legacy evidence, допустимость включения в VCS или отдельный доступный архив | Handoff / owner |
| OQ-15 | Условия rollout/пилота, QA device matrix, критерии production acceptance, ресурсы и сроки | Development Plan / Product, IT, QA |

Подробные прежние локальные RU/EN Open Questions сохраняются как supporting context и не входят в публичный сайт. Этот реестр — переносимая в Git сводка без назначения неподтверждённых решений. Следующая работа: [границы трёх пакетов документации](current/DOCUMENTATION_HANDOFF.md).
