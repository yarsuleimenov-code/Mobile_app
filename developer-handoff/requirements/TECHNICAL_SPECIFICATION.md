# Техническое задание Mobile App

**Draft 1.2 — 2026-10-16. Согласованная бизнес-основа Release 1; финальная приёмка ТЗ не выполнена.** Основание: утверждённые UI/UX и реализованная логика прототипа, [baseline](../PROJECT_BASELINE.md), [решения](../decisions/DECISION_LOG.md) и текущая задача owner Phase 2. Текущий остаток [15 OQ и согласованный scope](RELEASE_1_DECISIONS.md) учитывает 12 согласованных и 3 отложенных BD. Это полный проект требований с обозначенными пробелами, не окончательная архитектура/API/roadmap.

Пакет передачи: **Mobile App Release 1 — ТЗ v1.0, 2026-10-16**. Статус: подготовлен для передачи команде с явно отмеченными уточнениями. [DEVELOPMENT_HANDOFF](../DEVELOPMENT_HANDOFF.md) задаёт состав и порядок работы. Версия пакета не меняет статусы отдельных решений и не означает окончательного утверждения всех деталей.

## Назначение и бизнес-цели

Приложение помогает экипажу и складу фиксировать физический груз по Order/PlaceID при Pickup, Delivery и Interstate, сохранять evidence передачи и документы, продолжать незавершённую работу. Цели: уменьшить повторный ввод и риск перепутать заказ/место; обеспечить сопоставимую историю передачи; сохранить понятную работу при нестабильной сети. Измеримые KPI, baseline значений и целевые улучшения не согласованы — не критерий приёмки текущего draft.

Минимальный результат фазы: требования, проверяемые AC, use cases, data requirements, NFR и traceability, достаточные для предметного согласования с owner/Operations/IT. Приложение при подготовке не изменяется.

## Статусы и правила применения

| Статус | Значение |
|---|---|
| Confirmed | Подтверждённое продуктовое правило либо поведение утверждённого reference. Подлежит сохранению в согласованном scope; не подтверждает production service/identity/legal readiness |
| Proposed | Аналитическая рекомендация с источником обоснования; не обязательна без решения |
| Needs Decision | Часть поведения/параметров требует уточнения при реализации. Не исключает весь модуль из согласованного scope: команда выполняет подтверждённую часть, конкретный нерешённый пункт согласует с owner |

Актуальные ответы и границы зафиксированы в [Release 1 decisions](RELEASE_1_DECISIONS.md) и decision log. Составные OQ не закрываются целиком только по статусу BD. Для Confirmed требования могут оставаться OQ по реальному сервису, NFR или checkpoint; статус означает подтверждение только сформулированного ядра. Наблюдаемые constants/fixtures не становятся production policy: OTP matcher/лимиты, sample номера/даты Trip, 100 mock photos, Qty clamp и localStorage implementation не задают SLA, capacity или безопасность.

Все FR содержат два именованных AC и строку Release 1. Поздние/условные/reference требования сохраняют IDs, но их AC не являются gates ядра до включения в scope. Для Needs Decision AC проверяют готовность решения и пример ожидаемого поведения после согласования; они не считаются подписанными release gates. В NFR AC для Proposed имеют тот же условный статус. Сквозные сценарии описаны один раз в [Use Cases](WORKFLOWS_AND_USE_CASES.md); RTM — [отдельно](REQUIREMENTS_TRACEABILITY.md).

## Product scope

| Граница | Состав и статус |
|---|---|
| Confirmed reference scope | Home/Tasks/Scan/More; ручные и назначенные Pickup/Dropoff; draft/groups/measurements/photos; Order details/Requirements/contacts/map-copy; eBOL/signature/OTP/Supplemental/POD/version actions/email-copy; Cargo/labels; Interstate load/review/Trip/BOL/receive/archive; Pre/Post-trip; communications; help и служебные reference controls |
| Accepted product concepts | Раздельные local handoffs; Same Day через RouteRun, Order-owned movement_type; UUIDv7 opaque identity/alias; immutable facts/versions, correction/reversal; PD-014 ownership |
| Scope после ответов BD | Внутренний dispatch/Same Day orchestration не требуется; Interstate позднее; exceptions через диспетчера и skip. Полный доступ зарегистрированным, gate только route import, платформа iPhone/iPad. Mapping/session/conflicts/hardware/NFR параметры ещё открыты |
| Не включать автоматически | Redesign, route optimization, payment/billing, полноценную ERP/desktop administration, shift accounting, repair management, новые incoming/missed calls/call history, barcode standalone Sheets scope, replacement label flow без решения |
| Вне этой документационной задачи | Изменение кода/UI/workflows/моделей/config, реализация интеграций, финальная физическая БД/stack и commit/push. Architecture draft и Development Plan зависимостей подготовлены отдельно |

Это каталог reference функциональности. Колонка Release 1 у каждого FR задаёт применимость; ранние scope/actor описания ниже читаются с уточнениями BD-01–15. Ядро первого релиза определено BD-01/03; см. [scope](RELEASE_1_DECISIONS.md#scope-первого-релиза). Поздние и условные модули не включаются автоматически. Реальный способ реализации camera/scan/print/SMS/files определяется после требований, без подмены имитаций внешними гарантиями.

## Actors и системные границы

| Actor | Задача | Ограничение |
|---|---|---|
| Driver / экипаж / delivery | Задачи, cargo evidence, осмотры, handoff и связь | Warehouse/driver/delivery — текущие context roles; Release 1 — полный доступ зарегистрированного пользователя |
| Warehouse staff | Cargo/labels, Loading/Unloading, Trip/BOL | Release 1 — все данные и действия для зарегистрированного пользователя по BD-06 |
| External Pickup/Delivery contact | Ознакомиться с evidence, comment, signature/OTP | Не объявляется authenticated app user; источник контакта и verification — OQ-03/08 |
| Dispatcher | Рабочие поля заказа, назначение в целевой модели | В прототипе только локальные редактирования; assignment service не реализован |
| Supervisor | Поддержка/эскалации по capabilities | Crew-lead mapping в demo не нормативен; override не утверждён |
| Admin/support | Поддержка по будущей policy | Reference role/reset switch не production управление пользователями |
| External systems | Плановые данные, identity, media/document delivery, communications и devices | Источник маршрута Spoke выбран; отдельный модуль Twilio указан owner; field contracts/готовность каналов не проверены; список кандидатов не гарантирует интеграцию |

Плановые Order/Task/RouteRun относятся к внешнему master, operational facts — Zaberman, версии документов — документному контуру по PD-014. Trip master временно описан в принятой целевой границе, конкретный TMS/источник OQ-03. Прототип — browser/local state, отдельный NestJS Create CargoPlace POC его не обслуживает. Существующий OpenAPI не описывает все перечисленные операции.

## Функциональные требования

### FR-001

**Навигация**

| Поле | Требование |
|---|---|
| Module / Workflow | Navigation / [UC-01](WORKFLOWS_AND_USE_CASES.md#uc-01) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Сохранить Home, Tasks, Scan, More и вторичные экраны активного router. |
| Бизнес-правило | Interstate остаётся вторичным разделом; login/SameDay detail не объявляются существующими экранами. |
| Пользователь / роль | Все операционные пользователи |
| Предусловия | Приложение открыто. |
| Основной сценарий | Выбрать раздел нижнего меню, затем доступное действие. |
| Альтернативные сценарии | Неизвестный hash route возвращает Home; Help открывает RU/EN help. |
| Исключения / ошибки | Нет контекста заказа — предусмотренное empty/blocking состояние, без чужих данных. |
| Связанные сущности | User context, Order, Task |
| Источник | [Baseline](../PROJECT_BASELINE.md); [App.tsx](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/App.tsx) |
| Нерешённые зависимости | Нет отдельного OQ по ядру; общие production NFR применяются |

- **FR-001-AC1:** Каждый из четырёх пунктов открывает свой экран.
- **FR-001-AC2:** Неизвестный путь открывает Home; Help доступен из More.

### FR-002

**Контекст и защита переходов**

| Поле | Требование |
|---|---|
| Module / Workflow | Navigation / [UC-01](WORKFLOWS_AND_USE_CASES.md#uc-01) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Сохранять контекст Order/operation/stop при переходе к деталям, документу и возврате. |
| Бизнес-правило | Review/signing относится к конкретному заказу и актуальной версии draft. |
| Пользователь / роль | Экипаж/водитель |
| Предусловия | Открыта операция заказа A. |
| Основной сценарий | Открыть детали/контакты и вернуться в тот же draft. |
| Альтернативные сценарии | Смена Order выполняется явным Open selected order; уже locked версия read-only. |
| Исключения / ошибки | Stale review, прямой signing без review или другой Order не могут подтвердить текущую передачу. |
| Связанные сущности | Order, Stop, Draft, Evidence revision |
| Источник | [PickupCaptureScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PickupCaptureScreen.tsx); [PickupSignatureScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PickupSignatureScreen.tsx); [demoRehearsal tests](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/demoRehearsal.test.ts) |
| Нерешённые зависимости | OQ-07 |

- **FR-002-AC1:** Переход к деталям и назад сохраняет Order A и его данные.
- **FR-002-AC2:** Изменённый draft требует актуального review; подпись по старому review не принимается.

### FR-003

**Список задач**

| Поле | Требование |
|---|---|
| Module / Workflow | Tasks / [UC-02](WORKFLOWS_AND_USE_CASES.md#uc-02) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Показывать остановки с номером/operational name, типом, временем, Stop, Qty и полным адресом. |
| Бизнес-правило | Pickup и Dropoff остаются отдельными остановками; Tasks не является оптимизатором маршрута. |
| Пользователь / роль | Экипаж/водитель |
| Предусловия | Доступен route/task context. |
| Основной сценарий | Фильтр All/Pickup/Dropoff → поиск → открыть выбранную операцию. |
| Альтернативные сценарии | Нет совпадений — empty state; из остановки доступны детали и customer thread. |
| Исключения / ошибки | Недоступный адрес/данные обозначаются явно; политика stale/cancelled задач не определена. |
| Связанные сущности | Task, Stop, Order, Route context |
| Источник | [TasksScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/TasksScreen.tsx); [spokeDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/spokeDomain.ts) |
| Нерешённые зависимости | OQ-01, OQ-03 |

- **FR-003-AC1:** Фильтр Pickup исключает Dropoff из результатов.
- **FR-003-AC2:** Выбранная остановка передаёт свой Order и stop в операцию.

### FR-004

**Загрузка дневного маршрута**

| Поле | Требование |
|---|---|
| Module / Workflow | Tasks / [UC-02](WORKFLOWS_AND_USE_CASES.md#uc-02) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Получать подготовленный дневной маршрут из Spoke API после успешного Pre-trip текущего vehicle cycle. |
| Бизнес-правило | Pre-trip gate применяется к загрузке маршрута из Spoke; остальные функции могут оставаться доступны. Диспетчеризация выполняется вне Mobile App. |
| Пользователь / роль | Водитель |
| Предусловия | Home; vehicle cycle выбран в текущем контексте. |
| Основной сценарий | Пройти Pre-trip → загрузить маршрут → открыть остановку. |
| Альтернативные сценарии | При завершённом Post-trip сначала начать новый cycle; route можно убрать и загрузить заново. |
| Исключения / ошибки | Issue/неполный осмотр блокирует import. API failure не заменяет старый маршрут пустым успешным; refresh/cancel и восстановление допуска — RQ-03/04. |
| Связанные сущности | Inspection, Route context, Stop |
| Источник | [CargoHomeScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/CargoHomeScreen.tsx); [preTripInspectionDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/preTripInspectionDomain.ts) ; [Согласованные BD](RELEASE_1_DECISIONS.md), owner 2026-10-16 |
| Нерешённые зависимости | OQ-03, OQ-12 |

- **FR-004-AC1:** На Home до успешного осмотра загрузка маршрута недоступна.
- **FR-004-AC2:** После passed загрузка доступна; после Post-trip новый cycle снова требует Pre-trip.

### FR-005

**Данные заказа**

| Поле | Требование |
|---|---|
| Module / Workflow | Order details / [UC-03](WORKFLOWS_AND_USE_CASES.md#uc-03) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Показывать external/internal name, Qty, source/Spoke preview, Special Cargo, Requirements и Order note. |
| Бизнес-правило | Requirements — отдельный read-only текст, не автоматическая связь с другим заказом. |
| Пользователь / роль | Операционные пользователи |
| Предусловия | Известен Order. |
| Основной сценарий | Открыть Order details; прочитать handling до контактов и note после. |
| Альтернативные сценарии | Нет Requirements — блок скрыт; длинные названия/текст переносятся. |
| Исключения / ошибки | Отсутствующее external/internal значение не заменяется выдуманными данными. |
| Связанные сущности | Order, OrderDetails, Source reference |
| Источник | [orderDetailsDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderDetailsDomain.ts); [orderRequirements](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderRequirements.ts); [Baseline](../PROJECT_BASELINE.md) |
| Нерешённые зависимости | OQ-03 |

- **FR-005-AC1:** Requirements с переносами виден полностью и входит в Copy summary.
- **FR-005-AC2:** При отсутствии Requirements отдельный пустой блок не отображается.

### FR-006

**Редактирование рабочих данных**

| Поле | Требование |
|---|---|
| Module / Workflow | Order details / [UC-03](WORKFLOWS_AND_USE_CASES.md#uc-03) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Разделять внешнее имя, рабочее имя и Special Cargo; сохранять историю разрешённых изменений. |
| Бизнес-правило | Release 1: зарегистрированный пользователь имеет все доступные действия и данные (BD-06). Известное internal name ≤80; если данные фиксации невозможно предоставить, требуется комментарий менеджера о том, что отсутствует и почему (BD-09). Изменения не переписывают signed snapshot. |
| Пользователь / роль | Зарегистрированный операционный пользователь; прежние Dispatcher/Supervisor gates — только AS-IS reference. |
| Предусловия | Unsigned editable данные заказа. |
| Основной сценарий | Изменить разрешённое поле → сохранить → увидеть history. |
| Альтернативные сценарии | Draft можно сохранить без имени; исходное trade_name read-only; signed document/reprint сохраняет свой snapshot. |
| Исключения / ошибки | Неверный формат введённого значения отклоняется; отсутствие данных допускается с комментарием BD-09. Отсутствие обязательного комментария блокирует переход. |
| Связанные сущности | OrderDetails, Change entry, Document snapshot |
| Источник | [orderDetailsDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderDetailsDomain.ts); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [orderDetails tests](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderDetails.test.ts) ; [Согласованные BD](RELEASE_1_DECISIONS.md), owner 2026-10-16 |
| Нерешённые зависимости | OQ-06 |

- **FR-006-AC1:** Имя из 81 символа отклоняется; если сведения отсутствуют, комментарий менеджера с перечнем и причиной допускает продолжение по BD-09.
- **FR-006-AC2:** Изменение имени зарегистрированным пользователем не меняет ранее locked версию.

### FR-007

**Контакты команды**

| Поле | Требование |
|---|---|
| Module / Workflow | Contacts / [UC-03](WORKFLOWS_AND_USE_CASES.md#uc-03) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Показывать Dispatcher/Broker/Manager в контексте конкретной операции/stop и копировать сводку заказа. |
| Бизнес-правило | Нельзя выбирать первый адрес другого stop только по совпадению Order. |
| Пользователь / роль | Экипаж/водитель |
| Предусловия | Открыт Order details с operation/stop при наличии. |
| Основной сценарий | Найти контакт; открыть поддерживаемый handle либо Copy summary. |
| Альтернативные сценарии | Нет контакта/stop — явное отсутствие; полный адрес сохраняется в сводке. |
| Исключения / ошибки | Невалидный handle не превращается в ошибочный deep link; clipboard failure обозначается. |
| Связанные сущности | Order, Stop, Team contact |
| Источник | [teamContactsDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/teamContactsDomain.ts); [teamContacts tests](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/teamContactsDomain.test.ts) |
| Нерешённые зависимости | OQ-03 |

- **FR-007-AC1:** Copy summary включает выбранный Order, операцию, stop/address и Requirements.
- **FR-007-AC2:** Для отсутствующего stop сводка не использует чужой адрес.

### FR-008

**Внешняя навигация**

| Поле | Требование |
|---|---|
| Module / Workflow | Navigation / [UC-03](WORKFLOWS_AND_USE_CASES.md#uc-03) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Предоставлять Navigate в Google Maps и Copy address для доступного полного адреса остановки. |
| Бизнес-правило | Действие использует конкретный stop; это внешняя ссылка/clipboard, не собственная маршрутизация. |
| Пользователь / роль | Водитель/экипаж |
| Предусловия | Известен адрес. |
| Основной сценарий | Нажать Navigate либо Copy address. |
| Альтернативные сценарии | При недоступном адресе действие не отправляет пустой destination. |
| Исключения / ошибки | Нет доступа к clipboard/внешнему приложению — понятный результат, draft сохраняется. |
| Связанные сущности | Stop, Address, Draft |
| Источник | [StopNavigation](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/StopNavigation.tsx); [externalNavigation tests](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/externalNavigationDomain.test.ts) |
| Нерешённые зависимости | OQ-09 |

- **FR-008-AC1:** Destination соответствует полному адресу выбранной остановки.
- **FR-008-AC2:** После возврата в приложение draft и контекст заказа сохранены.

### FR-009

**Предрейсовый осмотр**

| Поле | Требование |
|---|---|
| Module / Workflow | Inspections / [UC-04](WORKFLOWS_AND_USE_CASES.md#uc-04) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Сохранить Check → Photos → Review: восемь проверок, пять camera-only ракурсов и attestation. |
| Бизнес-правило | Все checks отвечены Pass; любой Issue блокирует completed. Ракурсы: Front, Rear, Driver side, Passenger side, Dashboard; gallery здесь нет. |
| Пользователь / роль | Водитель |
| Предусловия | Открыт незавершённый Pre-trip vehicle cycle. |
| Основной сценарий | Ответить по checks → снять ракурсы → подтвердить attestation → завершить. |
| Альтернативные сценарии | Прервать и продолжить сохранённый осмотр; завершённый результат read-only. |
| Исключения / ошибки | Issue, недостающий ракурс, отсутствие attestation/camera или ошибка сохранения не дают объявить успешный осмотр. |
| Связанные сущности | Vehicle context, Inspection, Check, Photo |
| Источник | [preTripInspectionDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/preTripInspectionDomain.ts); [PreTripInspectionScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PreTripInspectionScreen.tsx) |
| Нерешённые зависимости | OQ-05, OQ-12 |

- **FR-009-AC1:** При одном Issue осмотр не получает passed.
- **FR-009-AC2:** Восемь Pass, пять ракурсов и attestation позволяют завершить; gallery не предлагается.

### FR-010

**Послерейсовый осмотр и цикл**

| Поле | Требование |
|---|---|
| Module / Workflow | Inspections / [UC-04](WORKFLOWS_AND_USE_CASES.md#uc-04) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Сохранить Post-trip, историю пар осмотров и Start next vehicle cycle. |
| Бизнес-правило | Issue требует описания, но не запрещает Post-trip report; незавершённые stops требуют acknowledgment, не закрываются автоматически. |
| Пользователь / роль | Водитель |
| Предусловия | Есть completed Pre-trip; Post-trip ещё не завершён. |
| Основной сценарий | Checks/issue notes → пять ракурсов → attestation → завершить; затем новый cycle. |
| Альтернативные сценарии | Просмотр completed/history read-only; следующий cycle очищает текущий осмотр, сохраняя историю. |
| Исключения / ошибки | Без issue reason, фото, attestation или acknowledgement при unfinished stops отчёт не завершается. |
| Связанные сущности | Vehicle cycle, Pre/Post Inspection, Stop count |
| Источник | [postTripInspectionDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/postTripInspectionDomain.ts); [postTripInspection tests](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/postTripInspectionDomain.test.ts) |
| Нерешённые зависимости | OQ-12 |

- **FR-010-AC1:** Post-trip с описанным Issue завершается без автоматического завершения задач/Trip.
- **FR-010-AC2:** Новый cycle сохраняет предыдущую пару и снова требует Pre-trip.

### FR-011

**Черновик Pickup**

| Поле | Требование |
|---|---|
| Module / Workflow | Pickup / [UC-05](WORKFLOWS_AND_USE_CASES.md#uc-05) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Создавать, автосохранять и восстанавливать draft по Order и режиму standard/supplemental. |
| Бизнес-правило | Открытие planned Pickup не означает выполненную передачу; original/supplemental drafts не смешиваются. |
| Пользователь / роль | Экипаж/водитель |
| Предусловия | Открыт Pickup из Home/Task/Recent/draft. |
| Основной сценарий | Изменять упаковку, responsible, comment, группы/фото; продолжить ранее сохранённый draft. |
| Альтернативные сценарии | Сохранённые изменения приоритетнее fixtures; пустой draft разрешён без перехода к review. |
| Исключения / ошибки | Ошибка записи показывает unsaved/error и блокирует продолжение; не переключать Order с несохранённым состоянием. |
| Связанные сущности | Order, PickupDraft, CargoRecord |
| Источник | [PickupCaptureScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PickupCaptureScreen.tsx); [pickupDraftDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/pickupDraftDomain.ts); [pickupDraftStore](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/pickupDraftStore.ts) |
| Нерешённые зависимости | OQ-07 |

- **FR-011-AC1:** Перезагрузка восстанавливает сохранённые изменения того же draft.
- **FR-011-AC2:** Одно открытие planned заявки не помечает её завершённой.

### FR-012

**Группы размеров и места**

| Поле | Требование |
|---|---|
| Module / Workflow | Pickup / [UC-05](WORKFLOWS_AND_USE_CASES.md#uc-05) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Добавлять, менять и удалять группы одинаковых измерений, сохраняя индивидуальные PlaceID. |
| Бизнес-правило | Qty — число мест группы, не число предметов внутри места; уменьшение Qty не перенумеровывает сохранившиеся IDs. |
| Пользователь / роль | Экипаж/водитель |
| Предусловия | Editable Pickup draft. |
| Основной сценарий | Добавить группу → Qty/L/W/H/weight per place → проверить итог и history. |
| Альтернативные сценарии | Изменение общих параметров применяется местам выбранной группы; удаление группы удаляет её unsigned места. |
| Исключения / ошибки | Некорректный Qty не создаёт дробные/отрицательные места; UI clamp 1..999 — наблюдаемый reference, не capacity target. |
| Связанные сущности | DimensionGroup, CargoPlace, Draft history |
| Источник | [pickupDraftDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/pickupDraftDomain.ts); [cargoDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/cargoDomain.ts); [pickupGroups tests](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/pickupGroups.test.ts) |
| Нерешённые зависимости | OQ-09, OQ-10 |

- **FR-012-AC1:** Для Qty=3 существуют три разных PlaceID.
- **FR-012-AC2:** Удаление и повторное добавление не используют ID удалённого места для нового.

### FR-013

**Измерения и расчёты**

| Поле | Требование |
|---|---|
| Module / Workflow | Pickup / [UC-05](WORKFLOWS_AND_USE_CASES.md#uc-05) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Учитывать известные/частичные/неизвестные/неизмеримые размеры и неизвестный вес с reason. |
| Бизнес-правило | Известные значения >0; V=Σ(Q×L×W×H)/1728; вес=Σ(Q×weight/place); incomplete объём исключён из known total с явным warning. |
| Пользователь / роль | Экипаж/водитель |
| Предусловия | Есть группы размеров. |
| Основной сценарий | Ввести значения или reason для неполных измерений; проверить totals. |
| Альтернативные сценарии | Draft сохраняется с неполными данными; review разрешён с reason и warning; legacy allocation отмечен отдельно. |
| Исключения / ошибки | Отсутствующий reason блокирует review; неизвестное не показывать как измеренный ноль. |
| Связанные сущности | Measurement, DimensionGroup, Totals |
| Источник | [measurementDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/measurementDomain.ts); [pickupDraftDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/pickupDraftDomain.ts); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md) |
| Нерешённые зависимости | OQ-05 |

- **FR-013-AC1:** 3×24×24×36 in дают 36.00 cu ft; 3×18 lb дают 54 lb.
- **FR-013-AC2:** Группа с отсутствующей L и reason отмечена incomplete и не добавляет фиктивный объём.

### FR-014

**Готовность Pickup к review**

| Поле | Требование |
|---|---|
| Module / Workflow | Pickup / [UC-05](WORKFLOWS_AND_USE_CASES.md#uc-05) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Продолжать к Pickup review после сохранения draft и проверки данных либо документированного исключения BD-09. |
| Бизнес-правило | Нет жёсткого минимума фото. Если данные груза невозможно предоставить, комментарий ответственного менеджера перечисляет отсутствующие данные и причины; с ним можно продолжить. Save не равен подписи/lock. |
| Пользователь / роль | Экипаж/водитель |
| Предусловия | Editable draft. |
| Основной сценарий | Проверить ошибки → сохранить → Continue → draft ready → Open review или labels. |
| Альтернативные сценарии | Ноль фото, неизвестные размеры/вес или иные недостающие сведения груза: записать причину, сохранить и перейти к review с явной неполнотой. |
| Исключения / ошибки | Отсутствие данных без комментария, ошибка записи, чужой Order или stale revision блокируют переход. Это не разрешение создать вымышленный заказ/место. |
| Связанные сущности | Draft, OrderDetails, Evidence, eBOL |
| Источник | [PickupCaptureScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PickupCaptureScreen.tsx); [orderEbolDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderEbolDomain.ts); [measurementDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/measurementDomain.ts) ; [Согласованные BD](RELEASE_1_DECISIONS.md), owner 2026-10-16 |
| Нерешённые зависимости | OQ-05, OQ-07 |

- **FR-014-AC1:** При нуле фото и комментарии менеджера с указанием отсутствующих фото и причины сохранённый draft доступен для review; без комментария переход блокируется.
- **FR-014-AC2:** После сохранения review содержит текущие места/фото и причины отсутствующих данных; ошибка записи не даёт ложного Saved.

### FR-015

**Supplemental Pickup**

| Поле | Требование |
|---|---|
| Module / Workflow | Pickup / [UC-06](WORKFLOWS_AND_USE_CASES.md#uc-06) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | После lock добавлять новые места отдельным Supplemental и новой версией eBOL. |
| Бизнес-правило | Original остаётся read-only; у новых мест новые IDs; требуются новые подтверждения только добавленного состава. |
| Пользователь / роль | Экипаж/водитель |
| Предусловия | Pickup original locked; Order ещё допускает добавление по подтверждённой границе. |
| Основной сценарий | Add places → Supplemental draft → review новой версии → contact/driver confirmation → lock. |
| Альтернативные сценарии | Открытый Supplemental продолжается, не создаётся повторная unsigned версия. |
| Исключения / ошибки | Без новых мест review невозможен; unsigned Supplemental блокирует Confirm Dropoff. |
| Связанные сущности | Order, Supplemental operation/version, CargoPlace |
| Источник | [pickupDraftDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/pickupDraftDomain.ts); [orderEbolDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderEbolDomain.ts); [PickupCaptureScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PickupCaptureScreen.tsx) |
| Нерешённые зависимости | OQ-04, OQ-08 |

- **FR-015-AC1:** Original hash/состав/подтверждения не меняются после lock supplement.
- **FR-015-AC2:** Новая версия содержит только added places/evidence; unsigned additions не попадают в Delivery.

### FR-016

**Order eBOL и Pickup snapshot**

| Поле | Требование |
|---|---|
| Module / Workflow | eBOL / [UC-05](WORKFLOWS_AND_USE_CASES.md#uc-05) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Вести один Order eBOL заказа с раздельными Pickup/Delivery evidence и состояниями. |
| Бизнес-правило | Snapshot lock не равен server operation close. После lock original immutable; checkpoint freeze первой подписи требует OQ-08. |
| Пользователь / роль | Контакт и водитель |
| Предусловия | Актуальный review того же Order. |
| Основной сценарий | Проверить evidence → confirmations → driver confirm → locked Pickup. |
| Альтернативные сценарии | Повторный вход открывает locked view; редактирование до lock требует повторного review. |
| Исключения / ошибки | Неполный evidence/подтверждения либо write failure не должны создавать видимость locked success. |
| Связанные сущности | Order eBOL, HandoffSnapshot, Confirmation |
| Источник | [orderEbolDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderEbolDomain.ts); [PickupSignatureScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PickupSignatureScreen.tsx); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md) |
| Нерешённые зависимости | OQ-07, OQ-08 |

- **FR-016-AC1:** Locked Pickup нельзя перезаписать повторным Save Pickup.
- **FR-016-AC2:** Pickup lock не создаёт completed eBOL/POD до Delivery.

### FR-017

**Подтверждения сторон**

| Поле | Требование |
|---|---|
| Module / Workflow | eBOL / [UC-05](WORKFLOWS_AND_USE_CASES.md#uc-05) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Сохранить последовательность contact confirmation → обязательная подпись водителя на каждой передаче. |
| Бизнес-правило | Contact: device signature либо verified OTP; водитель подписывает всегда. Подтверждение относится к evidence и exceptions, не к отсутствию damage. |
| Пользователь / роль | Контакт; водитель Zaberman |
| Предусловия | Review и имена участников заполнены; evidence актуален. |
| Основной сценарий | Контакт подтверждает → водитель видит подтверждение и подписывает → lock. |
| Альтернативные сценарии | OTP заменяет только подпись контакта; Supplemental использует ту же последовательность. |
| Исключения / ошибки | Нет подписи водителя или contact confirmation — lock недоступен; автоиспользование сохранённой подписи без подтверждения/делегации запрещено. |
| Связанные сущности | Contact/driver Confirmation, Evidence version |
| Источник | [orderEbolDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderEbolDomain.ts); [PickupSignatureScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PickupSignatureScreen.tsx); [DeliverySignatureScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/DeliverySignatureScreen.tsx); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md) |
| Нерешённые зависимости | OQ-06, OQ-08 |

- **FR-017-AC1:** OTP verified без driver signature не позволяет lock.
- **FR-017-AC2:** Документ с описанным damage можно подтвердить; signer/method/time сохраняются.

### FR-018

**OTP подтверждение**

| Поле | Требование |
|---|---|
| Module / Workflow | eBOL / [UC-07](WORKFLOWS_AND_USE_CASES.md#uc-07) |
| Статус | Confirmed |
| Release 1 | Условно: device/provider contract и проверка готовности |
| Описание | Предоставлять SMS code как альтернативу device signature во всех Pickup/Delivery. |
| Бизнес-правило | Ввод шести цифр и подтверждённый recipient; UI mask/неизменяемый номер; код не хранится в документе. |
| Пользователь / роль | Контакт/экипаж; водитель после verification |
| Предусловия | Выбран OTP, доступен контакт текущего Order. |
| Основной сценарий | Send → ввод → successful verification → driver signing. |
| Альтернативные сценарии | Invalid/expired/delivery error/offline/locked видимы; повтор в пределах согласованной policy. |
| Исключения / ошибки | Прототип: 3 attempts/3 sends, 111111 invalid; остальные шесть цифр могут success. Этот matcher и лимиты не production verification contract. |
| Связанные сущности | OTP challenge/state, Confirmation, Order |
| Источник | [deliveryOtpDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/deliveryOtpDomain.ts); [DeliveryOtpVerification](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/DeliveryOtpVerification.tsx); [orderEbolDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderEbolDomain.ts) |
| Нерешённые зависимости | OQ-06, OQ-08, OQ-11 |

- **FR-018-AC1:** Без verified OTP driver-signing ветка недоступна.
- **FR-018-AC2:** После verification snapshot содержит метод и masked phone reference, а не сам код.

### FR-019

**Комментарии при подписании**

| Поле | Требование |
|---|---|
| Module / Workflow | eBOL / [UC-07](WORKFLOWS_AND_USE_CASES.md#uc-07) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Хранить комментарии контакта и водителя отдельно на шагах соответствующих сторон. |
| Бизнес-правило | Изменение комментария сбрасывает подтверждение соответствующей стороны; OTP contact comment записывается до verification. |
| Пользователь / роль | Контакт; водитель; экипаж при записи слов контакта |
| Предусловия | Editable handoff review/signing. |
| Основной сценарий | Внести свой комментарий → подтвердить; сохранить оба в locked version. |
| Альтернативные сценарии | Комментарии необязательны; exception note — отдельное поле с отдельным правилом. |
| Исключения / ошибки | Изменённый OTP comment требует новой проверки; locked comments не редактируются. |
| Связанные сущности | HandoffComments, Confirmation, Snapshot |
| Источник | [Handoff comments specification](https://github.com/yarsuleimenov-code/Mobile_app/blob/main/docs/system-report/HANDOFF_COMMENTS_SIGNING_WIREFRAME.md); [orderEbolDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderEbolDomain.ts); [PickupSignatureScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PickupSignatureScreen.tsx); [DeliverySignatureScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/DeliverySignatureScreen.tsx) |
| Нерешённые зависимости | OQ-08 |

- **FR-019-AC1:** Изменение driver comment требует новой driver signature.
- **FR-019-AC2:** Read-only version и POD показывают оба комментария своего snapshot.

### FR-020

**Поиск и сверка Dropoff**

| Поле | Требование |
|---|---|
| Module / Workflow | Dropoff / [UC-08](WORKFLOWS_AND_USE_CASES.md#uc-08) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Находить CargoRecord по Order и показывать Pickup evidence для сверки. |
| Бизнес-правило | Показывать original и locked supplements; неподписанные additions не считать подтверждённым составом. |
| Пользователь / роль | Экипаж/водитель |
| Предусловия | Открыт Dropoff. |
| Основной сценарий | Search Order → прочитать Qty/measurements/Pickup photos → сверить груз. |
| Альтернативные сценарии | Task entry открывает конкретный Order/stop; saved Delivery draft восстанавливается. |
| Исключения / ошибки | Unknown Order показывает not found; редактирование номера не оставляет доступным Confirm для предыдущего Order. |
| Связанные сущности | Order, CargoRecord, EffectivePickupEvidence, DeliveryDraft |
| Источник | [DropoffVerifyScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/DropoffVerifyScreen.tsx); [orderEbolDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderEbolDomain.ts) |
| Нерешённые зависимости | OQ-03, OQ-04 |

- **FR-020-AC1:** Результат поиска соответствует введённому Order.
- **FR-020-AC2:** Смена номера требует поиска и не подтверждает старый заказ.

### FR-021

**Сохранение Dropoff**

| Поле | Требование |
|---|---|
| Module / Workflow | Dropoff / [UC-08](WORKFLOWS_AND_USE_CASES.md#uc-08) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Сохранить Delivery evidence и перейти к требуемому review, не смешивая этапы завершения. |
| Бизнес-правило | Delivery evidence сохраняется; недоступные сведения допускаются с комментарием менеджера (BD-09), включая отсутствие фото. Несовпадение/отказ — BD-05, без фиктивного matches или completed. Подписи и проверка unsigned Supplemental остаются отдельными условиями. |
| Пользователь / роль | Экипаж/водитель |
| Предусловия | Order найден, Delivery ещё не locked. |
| Основной сценарий | Записать фото/condition → Confirm Dropoff → открыть Delivery review, если Pickup locked. |
| Альтернативные сценарии | Нет фото/измерений: комментарий с причиной допускает продолжение. Физический отказ/ошибка: сообщить диспетчеру и перейти к другой точке, оставив проблемную незавершённой. Если Pickup не locked, сохранить draft и направить на Pickup review. |
| Исключения / ошибки | Storage/document-save failure оставляет форму для retry и не показывает успешный новый document save. |
| Связанные сущности | DeliveryDraft, CargoRecord status, Order eBOL |
| Источник | [DropoffVerifyScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/DropoffVerifyScreen.tsx); [orderEbolDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderEbolDomain.ts) ; [Согласованные BD](RELEASE_1_DECISIONS.md), owner 2026-10-16 |
| Нерешённые зависимости | OQ-04, OQ-07, OQ-08 |

- **FR-021-AC1:** При отсутствии Delivery фото с объясняющим комментарием возможно продолжение; физическое несовпадение/отказ не даёт полного success и допускает переход к следующей точке.
- **FR-021-AC2:** При ошибке записи success не показан; без Pickup lock предлагается Pickup review, незавершённый Supplemental не становится подтверждённым.

### FR-022

**Delivery signing**

| Поле | Требование |
|---|---|
| Module / Workflow | eBOL / [UC-08](WORKFLOWS_AND_USE_CASES.md#uc-08) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Подтверждать Delivery evidence контактом и водителем, затем блокировать Delivery snapshot. |
| Бизнес-правило | Для prepare/lock Delivery нужен locked Pickup, evidence того же Order и актуальный review. |
| Пользователь / роль | Контакт Delivery; водитель |
| Предусловия | Pickup locked; Delivery review подготовлен. |
| Основной сценарий | Review → signature/OTP контакта → driver signature → lock Delivery. |
| Альтернативные сценарии | Повторное открытие locked Delivery read-only; комментарии подчиняются FR-019. |
| Исключения / ошибки | Нет Pickup lock/Delivery evidence, другой Order, неполные confirmations — завершение запрещено. |
| Связанные сущности | Order eBOL, DeliverySnapshot, Confirmation |
| Источник | [orderEbolDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderEbolDomain.ts); [DeliverySignatureScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/DeliverySignatureScreen.tsx) |
| Нерешённые зависимости | OQ-07, OQ-08 |

- **FR-022-AC1:** Успешный Delivery lock переводит eBOL в completed.
- **FR-022-AC2:** Pickup snapshot при Delivery lock не меняется; повторный lock отклоняется.

### FR-023

**POD**

| Поле | Требование |
|---|---|
| Module / Workflow | Documents / [UC-09](WORKFLOWS_AND_USE_CASES.md#uc-09) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Показывать итоговый POD completed Order eBOL с Pickup/Delivery evidence и подтверждениями. |
| Бизнес-правило | POD — view завершённого eBOL, не новый независимый документный lifecycle. |
| Пользователь / роль | Водитель/экипаж; уполномоченный читатель |
| Предусловия | eBOL completed и обе handoff записи locked. |
| Основной сценарий | Открыть POD; проверить evidence, exceptions, comments и четыре позиции confirmations. |
| Альтернативные сценарии | OTP marker заменяет подпись контакта; Supplemental отображает свою версию. |
| Исключения / ошибки | Прямой вход без условий POD показывает blocking state, не пустой успешный документ. |
| Связанные сущности | Order eBOL, POD projection, Snapshots |
| Источник | [orderEbolDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderEbolDomain.ts); [OrderPodScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/OrderPodScreen.tsx) |
| Нерешённые зависимости | OQ-06, OQ-08 |

- **FR-023-AC1:** POD недоступен до Delivery lock.
- **FR-023-AC2:** После completion видны обе передачи и их собственные фото/comments/confirmation methods.

### FR-024

**История версий документов**

| Поле | Требование |
|---|---|
| Module / Workflow | Documents / [UC-09](WORKFLOWS_AND_USE_CASES.md#uc-09) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Открывать read-only original, locked Supplemental и Delivery по точному document key. |
| Бизнес-правило | Версия сохраняет своё имя, состав, measurement/evidence и подтверждения; unsigned версии не выдаются как signed. |
| Пользователь / роль | Уполномоченный читатель |
| Предусловия | Есть locked handoff versions. |
| Основной сценарий | Выбрать Document versions → открыть указанную версию. |
| Альтернативные сценарии | Порядок supplemental по version; позже добавленные места не переписывают старую версию. |
| Исключения / ошибки | Неизвестный/недоступный document key не подменяется последней версией. |
| Связанные сущности | DocumentVersion, HandoffSnapshot, PlaceIDs |
| Источник | [orderDocumentDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderDocumentDomain.ts); [OrderDocumentScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/OrderDocumentScreen.tsx) |
| Нерешённые зависимости | OQ-06, OQ-08 |

- **FR-024-AC1:** Открытие original после supplemental показывает исходный состав.
- **FR-024-AC2:** В перечне signed versions отсутствует unsigned Supplemental.

### FR-025

**Действия документов**

| Поле | Требование |
|---|---|
| Module / Workflow | Documents / [UC-09](WORKFLOWS_AND_USE_CASES.md#uc-09) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Предоставлять реальный PDF выбранной подписанной версии и действия документа в контексте этой версии. |
| Бизнес-правило | Подписи/eBOL сохраняются и передаются в центральное хранилище как PDF. Копия доступна независимо от signature/OTP способа подтверждения. Генерация, отправка и доставка имеют отдельные результаты; email опционален после интеграции. |
| Пользователь / роль | Уполномоченный читатель |
| Предусловия | Выбрана доступная версия. |
| Основной сценарий | Открыть action dialog → проверить document/параметры → выполнить → увидеть результат. |
| Альтернативные сценарии | Cancel не меняет документ; error/retry не меняет signed snapshot. |
| Исключения / ошибки | Недоступный канал/ошибка не показываются как доставленный production документ; повторную отправку определяет policy. |
| Связанные сущности | DocumentVersion, Action attempt, Recipient |
| Источник | [OrderDocumentActions](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/OrderDocumentActions.tsx); [OrderDocumentScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/OrderDocumentScreen.tsx) ; [Согласованные BD](RELEASE_1_DECISIONS.md), owner 2026-10-16 |
| Нерешённые зависимости | OQ-08, OQ-11 |

- **FR-025-AC1:** PDF открывается для выбранной подписанной версии с её подтверждениями; доступ не зависит от signature/OTP метода.
- **FR-025-AC2:** Сбой генерации/отправки допускает retry без изменения snapshot; generation success не объявляется delivery receipt.

### FR-026

**Email-копия Pickup**

| Поле | Требование |
|---|---|
| Module / Workflow | Documents / [UC-09](WORKFLOWS_AND_USE_CASES.md#uc-09) |
| Статус | Confirmed |
| Release 1 | Условно: device/provider contract и проверка готовности |
| Описание | Сохранить необязательный запрос email-копии конкретной подписываемой Pickup/Supplemental версии. |
| Бизнес-правило | Email-копия опциональна после подключения отдельного коммуникационного модуля. Доступ к подписанному PDF не зависит от выбора signature/OTP. AS-IS checkbox только в device-signature branch не задаёт production ограничение доступности PDF. |
| Пользователь / роль | Pickup contact и водитель |
| Предусловия | Contact подписывает на устройстве; версия ещё не locked. |
| Основной сценарий | Выбрать email copy → валидный адрес → contact confirmation → driver review/lock → status. |
| Альтернативные сценарии | Не запрашивать копию; Change возвращает к contact и сбрасывает подписи; offline queue/error/retry локальны. |
| Исключения / ошибки | Невалидный email блокирует завершение contact step при включённой копии; production delivery не реализована. |
| Связанные сущности | Version, EmailCopyRequest, DeliveryAttempt |
| Источник | [PickupSignatureScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PickupSignatureScreen.tsx); [documentEmailStore](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/documentEmailStore.ts); [Pickup email scope](https://github.com/yarsuleimenov-code/Mobile_app/blob/main/docs/system-report/PICKUP_EMAIL_COPY_WIREFRAME.md) ; [Согласованные BD](RELEASE_1_DECISIONS.md), owner 2026-10-16 |
| Нерешённые зависимости | OQ-08, OQ-11 |

- **FR-026-AC1:** Без запроса email-копии handoff завершается; при подключённой интеграции невалидный адрес требует исправления либо отказа от опции.
- **FR-026-AC2:** Email request/result связаны с точной signed version; PDF остаётся доступным при OTP без обязательной email отправки.

### FR-027

**Работа с фотографиями**

| Поле | Требование |
|---|---|
| Module / Workflow | Photos / [UC-10](WORKFLOWS_AND_USE_CASES.md#uc-10) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Добавлять фото camera/gallery в cargo evidence, задавать категорию, фильтровать/preview и удалять конкретное фото. |
| Бизнес-правило | Категории Before pickup, After delivery, Packaging, Condition, Damage. Ориентир ≥4 фото рекомендательный. При невозможности снять/предоставить фото достаточно обязательного комментария менеджера с причиной; inspection gate BD-11 отдельно. |
| Пользователь / роль | Экипаж/водитель |
| Предусловия | Editable Pickup/Delivery draft. |
| Основной сценарий | Выбрать категорию → capture/select → preview → сохранить. |
| Альтернативные сценарии | При camera/gallery unavailable сохранить причину отсутствия фото и продолжить грузовую операцию по BD-09. Фактические файлы хранить локально до подтверждённой синхронизации. |
| Исключения / ошибки | Удаление конкретного фото не удаляет соседнее/чужую передачу; политика реальных размеров/формата — OQ-05. |
| Связанные сущности | Photo, Evidence, Draft |
| Источник | [photoEvidenceDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/photoEvidenceDomain.ts); [PhotoEvidence](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/PhotoEvidence.tsx) ; [Согласованные BD](RELEASE_1_DECISIONS.md), owner 2026-10-16 |
| Нерешённые зависимости | OQ-05, OQ-09 |

- **FR-027-AC1:** Удаление фото по ID сохраняет остальные фотографии.
- **FR-027-AC2:** Фильтр категории меняет представление, не количество исходных сохранённых фото.

### FR-028

**Разделение photo evidence**

| Поле | Требование |
|---|---|
| Module / Workflow | Photos / [UC-10](WORKFLOWS_AND_USE_CASES.md#uc-10) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Хранить привязку фото к Order, handoff и version/supplemental context. |
| Бизнес-правило | Locked original, Supplemental и Delivery показывают свои наборы; одна коллекция текущего Order не подменяет историю. |
| Пользователь / роль | Экипаж/водитель; читатель документа |
| Предусловия | Есть две или более версии/передачи. |
| Основной сценарий | Добавить фото нового handoff → открыть исходную locked версию и новую. |
| Альтернативные сценарии | До lock фото draft можно менять; после lock применяется immutable evidence правило. |
| Исключения / ошибки | Чужой Order/handoff/photo result не должен подтверждать новое evidence; поздний sync не подтверждает более свежую revision. |
| Связанные сущности | Photo ID, Order, Handoff/version, Sync revision |
| Источник | [photoEvidenceDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/photoEvidenceDomain.ts); [orderEbolDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderEbolDomain.ts); [photoEvidence tests](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/photoEvidence.test.ts) |
| Нерешённые зависимости | OQ-05, OQ-07 |

- **FR-028-AC1:** Добавление Delivery photo не меняет original Pickup photos.
- **FR-028-AC2:** Поздний результат старой sync revision не делает новую revision synced.

### FR-029

**Карточка Cargo Place**

| Поле | Требование |
|---|---|
| Module / Workflow | Cargo Places / [UC-11](WORKFLOWS_AND_USE_CASES.md#uc-11) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Показывать индивидуальное место: PlaceID, Order, n/N, группу/размеры, источник веса, label, status/location и короткую историю. |
| Бизнес-правило | Status/location — проекция фактов, не редактируемый произвольный текст; Trip для места необязателен. |
| Пользователь / роль | Склад/водитель/экипаж |
| Предусловия | Место доступно в текущих данных. |
| Основной сценарий | More → Cargo places → найти/открыть PlaceID. |
| Альтернативные сценарии | Unknown/неполные measurements помечены; место доступно без Interstate. |
| Исключения / ошибки | Ненайденное место не создаётся автоматически; история fixtures не authoritative серверный audit. |
| Связанные сущности | CargoPlace, Order, Measurement, PlaceEvent |
| Источник | [cargoPlaceTracking](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/cargoPlaceTracking.ts); [CargoPlaceScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/CargoPlaceScreen.tsx); [cargoDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/cargoDomain.ts) |
| Нерешённые зависимости | OQ-03, OQ-06 |

- **FR-029-AC1:** Место без Trip открывается с Order и доступными атрибутами.
- **FR-029-AC2:** Неизвестный вес обозначен unknown/known-only, а не фактическим нулём.

### FR-030

**Идентичность места и label**

| Поле | Требование |
|---|---|
| Module / Workflow | Cargo Places / [UC-11](WORKFLOWS_AND_USE_CASES.md#uc-11) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Сохранить принятое target правило immutable opaque UUIDv7 PlaceID и human-readable alias. |
| Бизнес-правило | Payload содержит schema version + opaque PlaceID; Order/размеры/status не кодируются. Prototype ZB-ORDER-NN — отдельный reference format. |
| Пользователь / роль | Склад/экипаж |
| Предусловия | Создаётся новое физическое место. |
| Основной сценарий | Назначить стабильный PlaceID и alias; использовать тот же ID в операциях/документах. |
| Альтернативные сценарии | Ранее выданные prototype/legacy labels требуют согласованного mapping, не немедленной переклейки. |
| Исключения / ошибки | Коллизия/неподдержанный payload не создают новое место незаметно; symbology/replacement — OQ-09. |
| Связанные сущности | CargoPlace identity, Label alias, Payload version |
| Источник | [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [placeLabelsDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/placeLabelsDomain.ts); [OpenAPI POC](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/backend/openapi.yaml) |
| Нерешённые зависимости | OQ-03, OQ-09 |

- **FR-030-AC1:** Reprint существующего места не меняет primary PlaceID.
- **FR-030-AC2:** Target payload не зависит от изменяемого имени/размеров/статуса заказа.

### FR-031

**Выборочная печать labels**

| Поле | Требование |
|---|---|
| Module / Workflow | Labels / [UC-11](WORKFLOWS_AND_USE_CASES.md#uc-11) |
| Статус | Confirmed |
| Release 1 | Условно: device/provider contract и проверка готовности |
| Описание | Сохранить Print all/selected/this label, version filter и preview точного выбранного набора. |
| Бизнес-правило | Print all действует в текущем version filter; Original/Supplemental наборы не смешиваются автоматически. |
| Пользователь / роль | Склад/экипаж |
| Предусловия | Есть места выбранного Order/version. |
| Основной сценарий | Открыть labels → выбрать набор → preview → Print. |
| Альтернативные сценарии | Можно печатать одно место; отмена preview не фиксирует успешную попытку. |
| Исключения / ошибки | Пустой набор/недоступный printer/error показывают соответствующее состояние, не success. |
| Связанные сущности | CargoPlace, Version filter, PrintSelection, PrintAttempt |
| Источник | [placeLabelsDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/placeLabelsDomain.ts); [PlaceLabelsScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PlaceLabelsScreen.tsx); [labelPrintStore](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/labelPrintStore.ts) |
| Нерешённые зависимости | OQ-09 |

- **FR-031-AC1:** Preview selected содержит только выбранные IDs.
- **FR-031-AC2:** Print all при Supplemental filter не включает original labels.

### FR-032

**Reprint и отказ принтера**

| Поле | Требование |
|---|---|
| Module / Workflow | Labels / [UC-11](WORKFLOWS_AND_USE_CASES.md#uc-11) |
| Статус | Confirmed |
| Release 1 | Условно: device/provider contract и проверка готовности |
| Описание | Сохранять идентичность места при reprint и показывать историю попыток/недоступность устройства. |
| Бизнес-правило | Print/reprint не меняет evidence; отсутствие принтера не уничтожает draft и допускает предусмотренный manual fallback. |
| Пользователь / роль | Склад/экипаж |
| Предусловия | Есть label и draft/review context. |
| Основной сценарий | Повторно выбрать label → Print → увидеть исход попытки. |
| Альтернативные сценарии | При printer unavailable продолжить сохранённый draft/review либо ручную проверку PlaceID; replacement не равен reprint. |
| Исключения / ошибки | Не выдавать result имитации за real hardware acknowledgement; target attention policy — OQ-09. |
| Связанные сущности | Label, PrintAttempt, Draft |
| Источник | [labelPrintStore](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/labelPrintStore.ts); [PlaceLabelsScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PlaceLabelsScreen.tsx); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md) |
| Нерешённые зависимости | OQ-09 |

- **FR-032-AC1:** Reprint содержит тот же PlaceID/active code.
- **FR-032-AC2:** Printer unavailable сохраняет draft и не создаёт успешную print запись.

### FR-033

**Общий Scan lookup**

| Поле | Требование |
|---|---|
| Module / Workflow | Scan / [UC-11](WORKFLOWS_AND_USE_CASES.md#uc-11) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Находить CargoPlace или Order через Scan и ручной ввод с понятным valid/duplicate/unknown результатом. |
| Бизнес-правило | Общий Scan выполняет lookup и не перемещает/не добавляет место. |
| Пользователь / роль | Склад/водитель/экипаж |
| Предусловия | Scan открыт. |
| Основной сценарий | Считать либо ввести код → увидеть результат → открыть найденный объект/активную задачу. |
| Альтернативные сценарии | Повтор последнего кода — duplicate feedback; неизвестный код остаётся в текущем flow. |
| Исключения / ошибки | Unknown/unsupported код не создаёт факт загрузки; QR decoder пока не подтверждён. |
| Связанные сущности | PlaceID/Order reference, Scan result |
| Источник | [ScanScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/ScanScreen.tsx); [placeScanDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/placeScanDomain.ts); [Baseline](../PROJECT_BASELINE.md) |
| Нерешённые зависимости | OQ-09 |

- **FR-033-AC1:** Скан известного PlaceID открывает результат этого места.
- **FR-033-AC2:** Два lookup одного кода не меняют load/receive counts.

### FR-034

**Scan внутри операции**

| Поле | Требование |
|---|---|
| Module / Workflow | Scan / [UC-12](WORKFLOWS_AND_USE_CASES.md#uc-12) |
| Статус | Confirmed |
| Release 1 | Позднее: Interstate |
| Описание | В Loading/Unloading принимать только допустимый PlaceID текущего набора/manifest, поддерживать manual input. |
| Бизнес-правило | Повторная scan-операция не удваивает учёт; lookup и operational scan различаются контекстом. |
| Пользователь / роль | Складской сотрудник |
| Предусловия | Открыта загрузка или приёмка определённого Trip/направления. |
| Основной сценарий | Ввести/считать PlaceID → проверить принадлежность → отметить loaded/received. |
| Альтернативные сценарии | В UI допускается явный выбор/снятие отметки и Load/Receive all remaining до close. |
| Исключения / ошибки | Чужое место/manifest не принимается; duplicate сообщает already loaded/received. |
| Связанные сущности | CargoPlace, LoadSelection, ReceiveSelection, Manifest |
| Источник | [InterstateLoadingScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/InterstateLoadingScreen.tsx); [InterstateUnloadingScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/InterstateUnloadingScreen.tsx); [interstateDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/interstateDomain.ts) |
| Нерешённые зависимости | OQ-04, OQ-09 |

- **FR-034-AC1:** Повторный ввод одного PlaceID не увеличивает число мест.
- **FR-034-AC2:** PlaceID вне допустимого набора оставляет counts неизменными.

### FR-035

**Направление и eligibility Interstate**

| Поле | Требование |
|---|---|
| Module / Workflow | Interstate / [UC-12](WORKFLOWS_AND_USE_CASES.md#uc-12) |
| Статус | Confirmed |
| Release 1 | Позднее: Interstate |
| Описание | Сохранить выбор origin/destination warehouse, truck и список подходящих Pickup records. |
| Бизнес-правило | В reference origin≠destination; eligibility = pickup_recorded + совпадение двух Branch. Это не complete production movement/signature policy. |
| Пользователь / роль | Складской сотрудник |
| Предусловия | Interstate открыт. |
| Основной сценарий | Выбрать направление/машину → увидеть eligible orders/place totals → Start loading. |
| Альтернативные сценарии | При смене origin/destination selection очищается; нет eligible — Start loading disabled. |
| Исключения / ошибки | Выбор того же склада на обеих сторонах недоступен; разрешённые lanes и gate signed pickup требуют решения. |
| Связанные сущности | Branch/Warehouse, Direction, Truck, CargoRecord |
| Источник | [interstateDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/interstateDomain.ts); [InterstateScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/InterstateScreen.tsx); [interstateStore](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/interstateStore.tsx) |
| Нерешённые зависимости | OQ-02, OQ-03, OQ-08 |

- **FR-035-AC1:** В eligible нет records другого origin/destination.
- **FR-035-AC2:** Смена направления очищает прежний выбранный набор загрузки.

### FR-036

**Loading review и Trip/BOL**

| Поле | Требование |
|---|---|
| Module / Workflow | Interstate / [UC-12](WORKFLOWS_AND_USE_CASES.md#uc-12) |
| Статус | Confirmed |
| Release 1 | Позднее: Interstate |
| Описание | Сохранить partial loading, review только выбранного состава, Create Trip & BOL и просмотр результата. |
| Бизнес-правило | Manifest/business totals считаются по фактически выбранным местам, не полному Order; BOL не должен откатывать складской факт при ошибке документа. |
| Пользователь / роль | Складской сотрудник |
| Предусловия | Выбрано ≥1 eligible place. |
| Основной сценарий | Загрузка мест → review → Create Trip & BOL → Trip → BOL. |
| Альтернативные сценарии | Частичный набор допустим; View trip details возвращает review. Target requires confirmed manifest, но AS-IS generatedTrip хранит только totals. |
| Исключения / ошибки | Пустой review перенаправляет к Loading; fixed sample IDs/date и memory-only selection не production numbering/persistence. |
| Связанные сущности | Trip, Loaded manifest concept, CargoPlace, Interstate BOL |
| Источник | [InterstateReviewScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/InterstateReviewScreen.tsx); [interstateDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/interstateDomain.ts); [interstateStore](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/interstateStore.tsx); [Confirmed flow decisions](../decisions/DECISION_LOG.md) |
| Нерешённые зависимости | OQ-03, OQ-07, OQ-08 |

- **FR-036-AC1:** Выбор 1 из 11 мест даёт 1 place в review/Trip summary.
- **FR-036-AC2:** Пустой selection не позволяет создать Trip; производственный manifest snapshot остаётся GAP-14.

### FR-037

**Unloading по manifest**

| Поле | Требование |
|---|---|
| Module / Workflow | Interstate / [UC-13](WORKFLOWS_AND_USE_CASES.md#uc-13) |
| Статус | Confirmed |
| Release 1 | Позднее: Interstate |
| Описание | Показывать incoming Trip manifest и отдельный receiving draft с ожидаемыми/принятыми/недостающими местами. |
| Бизнес-правило | Сверка идёт по confirmed loading manifest, не по исходному Order; incoming fixtures не automatic outbound continuation. |
| Пользователь / роль | Складской сотрудник |
| Предусловия | Есть доступный incoming Trip. |
| Основной сценарий | Открыть Trip → scan/select received → review. |
| Альтернативные сценарии | Receive all remaining, снять unsigned отметку; saved receiving draft восстанавливается. |
| Исключения / ошибки | Unknown Trip/чужое место не создают receiving факт; завершённый Trip открывается read-only result. |
| Связанные сущности | Trip, Manifest, ReceiveDraft, PlaceID |
| Источник | [InterstateUnloadingScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/InterstateUnloadingScreen.tsx); [interstateStore](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/interstateStore.tsx); [Confirmed flow decisions](../decisions/DECISION_LOG.md) |
| Нерешённые зависимости | OQ-03, OQ-04 |

- **FR-037-AC1:** Receiving одного места уменьшает missing на одно.
- **FR-037-AC2:** Reload восстанавливает receiving draft этого Trip и не смешивает другой Trip.

### FR-038

**Missing и закрытие Unloading**

| Поле | Требование |
|---|---|
| Module / Workflow | Interstate / [UC-13](WORKFLOWS_AND_USE_CASES.md#uc-13) |
| Статус | Confirmed |
| Release 1 | Позднее: Interstate |
| Описание | Перед Confirm unloading показывать missing список и требовать явное подтверждение расхождений. |
| Бизнес-правило | Close фиксирует результат приёмки; production discrepancy lifecycle не реализован UI marker-ом. |
| Пользователь / роль | Складской сотрудник |
| Предусловия | Открыт review receiving. |
| Основной сценарий | Проверить expected/received/missing → при missing подтвердить их → Confirm. |
| Альтернативные сценарии | Continue receiving возвращает к вводу; полный manifest закрывается без missing acknowledgment. |
| Исключения / ошибки | Missing без acknowledgment блокирует Confirm; server close и real discrepancies — OQ-04/07. |
| Связанные сущности | Receiving result, Missing PlaceIDs, Trip status |
| Источник | [InterstateUnloadingScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/InterstateUnloadingScreen.tsx); [interstateStore](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/interstateStore.tsx); [Confirmed flow decisions](../decisions/DECISION_LOG.md) |
| Нерешённые зависимости | OQ-04, OQ-07 |

- **FR-038-AC1:** При missing>0 без acknowledgment Confirm disabled.
- **FR-038-AC2:** После подтверждения Trip показан unloaded/result; повторное открытие не создаёт второе закрытие в reference.

### FR-039

**Архив Interstate BOL**

| Поле | Требование |
|---|---|
| Module / Workflow | Documents / [UC-13](WORKFLOWS_AND_USE_CASES.md#uc-13) |
| Статус | Confirmed |
| Release 1 | Позднее: Interstate |
| Описание | Искать текущие/закрытые Trip BOL по номеру, TripID, направлению или truck и открывать документ. |
| Бизнес-правило | Interstate BOL связан с Trip/manifest, не Order eBOL; Save as PDF/Print открывают browser print в reference. |
| Пользователь / роль | Склад/водитель; уполномоченный читатель |
| Предусловия | Есть BOL records текущего контекста. |
| Основной сценарий | Find Interstate BOL → query/status filter → открыть BOL. |
| Альтернативные сценарии | Из созданного Trip прямой Open Interstate BOL; нет совпадений — empty state. |
| Исключения / ошибки | Unknown BOL не подменяется чужим; реальная генерация/нумерация/доставка ещё не подтверждены. |
| Связанные сущности | Interstate BOL, Trip, Archive record |
| Источник | [interstateDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/interstateDomain.ts); [InterstateBolsScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/InterstateBolsScreen.tsx); [InterstateBolScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/InterstateBolScreen.tsx); [BOL decisions](../references/BOL_DECISION_LOG.md) |
| Нерешённые зависимости | OQ-06, OQ-08 |

- **FR-039-AC1:** Поиск по TripID находит связанный BOL.
- **FR-039-AC2:** Status filter closed исключает in_transit records.

### FR-040

**Local операции**

| Поле | Требование |
|---|---|
| Module / Workflow | Local / [UC-14](WORKFLOWS_AND_USE_CASES.md#uc-14) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Выполнять Local Pickup и Dropoff как самостоятельные операции заказа с обычными evidence/подтверждениями. |
| Бизнес-правило | Order-owned movement_type принят; одинаковые Branch не определяют Same Day и не требуют Interstate Trip/BOL. |
| Пользователь / роль | Экипаж/водитель |
| Предусловия | Назначена либо открыта local операция. |
| Основной сценарий | Открыть Pickup или Dropoff → выполнить соответствующий handoff. |
| Альтернативные сценарии | Операции могут выполняться отдельно; нет обязанности создавать Interstate manifest для local. |
| Исключения / ошибки | Не выводить автоматически следующий stop/статус RouteRun из одного подтверждения. |
| Связанные сущности | Order, Pickup, Dropoff, movement_type |
| Источник | [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [Baseline](../PROJECT_BASELINE.md); [App.tsx](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/App.tsx) |
| Нерешённые зависимости | OQ-01, OQ-03 |

- **FR-040-AC1:** Local Pickup проходит без обязательного Interstate Trip.
- **FR-040-AC2:** Совпадение origin/destination само по себе не присваивает local_same_day.

### FR-041

**Same Day orchestration**

| Поле | Требование |
|---|---|
| Module / Workflow | Local/Same Day / [UC-14](WORKFLOWS_AND_USE_CASES.md#uc-14) |
| Статус | Confirmed |
| Release 1 | Вне Mobile App: orchestration |
| Описание | Граница Same Day orchestration: создание/назначение пар и диспетчеризация выполняются вне Mobile App. |
| Бизнес-правило | Приложение выполняет отдельно назначенные Pickup и Dropoff; не создаёт автоматическую пару/общий completed и не оптимизирует маршрут (BD-01/02). |
| Пользователь / роль | Dispatch, водитель, Operations |
| Предусловия | Назначенные точки поступили через Spoke. |
| Основной сценарий | Показать назначенные точки; выполнить каждую как самостоятельный handoff. |
| Альтернативные сценарии | Отсутствующую/ошибочную точку уточнить с диспетчером; проблемную можно пропустить без success. |
| Исключения / ошибки | Изменения плана после начала работы — RQ-03; нет автоматического закрытия второй точки. |
| Связанные сущности | Order, RouteRun, Task pair |
| Источник | [Baseline](../PROJECT_BASELINE.md); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [Same Day KB](https://github.com/yarsuleimenov-code/Mobile_app/blob/main/knowledge-base/mobile-app/ru/same-day.md) ; [Согласованные BD](RELEASE_1_DECISIONS.md), owner 2026-10-16 |
| Нерешённые зависимости | Технический mapping Spoke и RQ-03; включение внутренней orchestration не требуется. |

- **FR-041-AC1:** Mobile App показывает отдельные назначенные Pickup/Dropoff и не создаёт пару/новое назначение самостоятельно.
- **FR-041-AC2:** Завершение Pickup не закрывает Dropoff автоматически; отсутствие второй точки направляется диспетчеру.

### FR-042

**Исключения передачи**

| Поле | Требование |
|---|---|
| Module / Workflow | Exceptions / [UC-15](WORKFLOWS_AND_USE_CASES.md#uc-15) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | При ошибке/отказе сообщить диспетчеру и разрешить переход к следующей точке без завершения проблемной. |
| Бизнес-правило | BD-05 — внешнее разрешение исключения. BD-09 разрешает продолжение с комментарием только для недоступных данных; реальную неполную/отказанную передачу не объявлять полной. |
| Пользователь / роль | Operations, водитель, supervisor, Dispatch |
| Предусловия | Обнаружено расхождение вне поддержанной простой ветки. |
| Основной сценарий | Сообщить диспетчеру → сохранить имеющуюся работу → открыть следующую точку, оставив проблемную незавершённой. |
| Альтернативные сценарии | Damage с описанием и подтверждениями допускает handoff; недостающие сведения с комментарием — FR-014/021. |
| Исключения / ошибки | Без решения нельзя подменять отказ/partial на matches=true или completed. |
| Связанные сущности | Handoff outcome, Discrepancy, Order, Task |
| Источник | [Baseline](../PROJECT_BASELINE.md); [DropoffVerifyScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/DropoffVerifyScreen.tsx); [InterstateUnloadingScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/InterstateUnloadingScreen.tsx); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md) ; [Согласованные BD](RELEASE_1_DECISIONS.md), owner 2026-10-16 |
| Нерешённые зависимости | RQ-02/03 для correction/активных назначений; Interstate outcomes отложены. |

- **FR-042-AC1:** При отказе можно сообщить диспетчеру и открыть следующую точку без отметки completed проблемной.
- **FR-042-AC2:** При недоступных сведениях правило комментария BD-09 действует отдельно; physical mismatch не заменяется matches=true.

### FR-043

**Исправление подтверждённого факта**

| Поле | Требование |
|---|---|
| Module / Workflow | Exceptions / [UC-15](WORKFLOWS_AND_USE_CASES.md#uc-15) |
| Статус | Confirmed |
| Release 1 | Invariant сохранён; correction UI зависит от RQ-02 |
| Описание | Сохранить invariant: correction/reversal создаёт новую запись/версию с причиной и связью с исходной. |
| Бизнес-правило | Нельзя разблокировать signed snapshot или заменить historical fact; полные permission/UI/void transitions ещё не определены. |
| Пользователь / роль | Зарегистрированный пользователь с полным доступом BD-06; порядок correction/void уточняется по RQ-02 |
| Предусловия | Есть подтверждённый факт, требующий исправления. |
| Основной сценарий | Применить согласованный correction process с ссылкой на исходный факт. |
| Альтернативные сценарии | Supplemental применяется к новому физическому грузу, не маскирует ошибку исходного факта. |
| Исключения / ошибки | Без полномочия/причины коррекция не подтверждается; detailed acceptance требует OQ-04/08. |
| Связанные сущности | Operation event, Reversal/Correction reference, Version |
| Источник | [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [BOL decisions](../references/BOL_DECISION_LOG.md) |
| Нерешённые зависимости | OQ-04, OQ-06, OQ-08 |

- **FR-043-AC1:** Исправление не изменяет исходный confirmed record.
- **FR-043-AC2:** Новая запись содержит reason и ссылку на исправляемый факт; новые места идут через Supplemental.

### FR-044

**Order messages**

| Поле | Требование |
|---|---|
| Module / Workflow | Communications / [UC-16](WORKFLOWS_AND_USE_CASES.md#uc-16) |
| Статус | Confirmed |
| Release 1 | Условно: device/provider contract и проверка готовности |
| Описание | Сохранить inbox/search/All-Unread, order thread, quick/custom texts, unread и local pending/error/retry/incoming. |
| Бизнес-правило | Thread связан с Order; corporate sender не заменяется личным номером сотрудника. Sample number не выбран production sender. |
| Пользователь / роль | Водитель/экипаж |
| Предусловия | Есть доступный Order thread. |
| Основной сценарий | Home/Task/Details/Pickup SMS → прочитать/отправить → увидеть status. |
| Альтернативные сценарии | Offline сообщение в queue; failure → Retry; incoming меняет unread. |
| Исключения / ошибки | Local sent не подтверждает provider delivery; неизвестный Order/канал не использует чужой контакт. |
| Связанные сущности | Order, Thread, Message, Sender, DeliveryState |
| Источник | [communicationDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/communicationDomain.ts); [OrderCommunicationsScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/OrderCommunicationsScreen.tsx); [CommunicationsScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/CommunicationsScreen.tsx) |
| Нерешённые зависимости | OQ-06, OQ-07, OQ-11 |

- **FR-044-AC1:** Отправленное сообщение появляется только в thread выбранного Order.
- **FR-044-AC2:** Offline → pending; ошибка → retryable status; unread отражает прочтение.

### FR-045

**Звонок из диалога**

| Поле | Требование |
|---|---|
| Module / Workflow | Communications / [UC-16](WORKFLOWS_AND_USE_CASES.md#uc-16) |
| Статус | Confirmed |
| Release 1 | Условно: device/provider contract и проверка готовности |
| Описание | Сохранить визуальный сценарий call из thread: ready/calling/connected/ended, Mute/Speaker и повтор. |
| Бизнес-правило | Прототип не выполняет телефонный звонок/аудио; реальная телефония и её scope требуют OQ-11. |
| Пользователь / роль | Водитель/экипаж |
| Предусловия | Открыт customer thread с call action. |
| Основной сценарий | Открыть call → Start → connected state → End. |
| Альтернативные сценарии | Повтор звонка возвращает сценарий; Mute/Speaker отражают выбранное состояние. |
| Исключения / ошибки | Real incoming/missed/call history/background audio не считаются подтверждённым scope. |
| Связанные сущности | Order, Contact, Call presentation state |
| Источник | [OrderCallScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/OrderCallScreen.tsx); [communicationDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/communicationDomain.ts) |
| Нерешённые зависимости | OQ-01, OQ-11 |

- **FR-045-AC1:** UI Start/End переводит reference call в соответствующие состояния.
- **FR-045-AC2:** Из call возвращается thread того же Order; reference не объявляется реальным provider call.

### FR-046

**Статусы сохранения и sync**

| Поле | Требование |
|---|---|
| Module / Workflow | Sync / [UC-17](WORKFLOWS_AND_USE_CASES.md#uc-17) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Показывать saved on device/pending/retry/conflict и результат синхронизации evidence. |
| Бизнес-правило | Late acknowledgement старой revision не подтверждает новую; local Keep local changes — reference action, не production merge policy. |
| Пользователь / роль | Операционный пользователь |
| Предусловия | Есть локально изменённые drafts/evidence. |
| Основной сценарий | Выполнить изменение → видеть pending → Sync now → результат. |
| Альтернативные сценарии | Offline остаётся pending; error→retry; conflict требует явного действия в reference. |
| Исключения / ошибки | Rejected/conflict не превращаются молча в synced; real reconciliation определяется OQ-07. |
| Связанные сущности | Operation/photo QueueItem, Revision, Sync state |
| Источник | [photoEvidenceDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/photoEvidenceDomain.ts); [useEvidenceSync](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/useEvidenceSync.ts); [photoEvidence tests](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/photoEvidence.test.ts) |
| Нерешённые зависимости | OQ-07 |

- **FR-046-AC1:** Offline изменение сохраняет pending, не server confirmed.
- **FR-046-AC2:** Поздний success старой revision не снимает pending актуального изменения.

### FR-047

**Administration и help**

| Поле | Требование |
|---|---|
| Module / Workflow | Administration / [UC-01](WORKFLOWS_AND_USE_CASES.md#uc-01) |
| Статус | Confirmed |
| Release 1 | Reference only: не production administration |
| Описание | Сохранить help и служебный reference доступ More→Administration/#/more/demo с presets/outcomes/reset. |
| Бизнес-правило | UI рабочих операций без demo/mock пояснений; controls служат проверке reference, не production RBAC/settings scope. |
| Пользователь / роль | Ведущий/QA; help — все пользователи |
| Предусловия | Reference prototype открыт. |
| Основной сценарий | Открыть Administration → выбрать роль/branch/network/device/scenario. |
| Альтернативные сценарии | Reset только с подтверждением; Cancel сохраняет данные; help ведёт к инструкциям. |
| Исключения / ошибки | Production доступ к reset/role switch не утверждён; перенос controls в рабочее приложение не обязателен. |
| Связанные сущности | ScenarioContext, Local data, Help links |
| Источник | [AGENTS.md](../references/AGENTS.md); [PrototypeControlsScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PrototypeControlsScreen.tsx); [MoreScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/MoreScreen.tsx) |
| Нерешённые зависимости | OQ-01, OQ-06 |

- **FR-047-AC1:** Administration открывается по сохранённому меню/route.
- **FR-047-AC2:** Cancel reset сохраняет данные; рабочие экраны сохраняют Print/Scan product labels.

### FR-048

**Production permissions и identity**

| Поле | Требование |
|---|---|
| Module / Workflow | Access / [UC-18](WORKFLOWS_AND_USE_CASES.md#uc-18) |
| Статус | Confirmed |
| Release 1 | Core / сохраняемая база первого этапа |
| Описание | Первый этап: зарегистрированный пользователь видит все данные и имеет все доступные действия приложения; сервер проверяет подлинность пользователя. |
| Бизнес-правило | BD-06 уточняет прежние рекомендации branch/capability restrictions. Полный доступ не разрешает переписывать immutable signed PDF и не подменяет подтверждения сторон. |
| Пользователь / роль | Зарегистрированный пользователь приложения. |
| Предусловия | Личность зарегистрированного пользователя проверена; механизм регистрации/IdP и session policy ещё выбираются. |
| Основной сценарий | Verified user → все данные приложения → разрешённое бизнес-правилами действие → серверная проверка и результат. |
| Альтернативные сценарии | Смена assignment, offline cached access, revoked/expired session — согласовать отдельно. |
| Исключения / ошибки | Незарегистрированный/недействительный online actor не выполняет защищённые запросы; offline expiry/revocation требует NFR-010. |
| Связанные сущности | User, Role/Capability, Assignment, Branch scope, Session |
| Источник | [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [Baseline](../PROJECT_BASELINE.md); [OpenAPI POC](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/backend/openapi.yaml) ; [Согласованные BD](RELEASE_1_DECISIONS.md), owner 2026-10-16 |
| Нерешённые зависимости | OQ-06, OQ-12 |

- **FR-048-AC1:** Два зарегистрированных пользователя получают все данные/доступные действия без branch/assignment запрета в Release 1.
- **FR-048-AC2:** Непроверенная клиентская роль/DEV context не заменяет серверную проверку; изменение подписанного PDF запрещено бизнес-инвариантом независимо от полного доступа.

### FR-049

**Политика Branch и movement**

| Поле | Требование |
|---|---|
| Module / Workflow | Movement / [UC-14](WORKFLOWS_AND_USE_CASES.md#uc-14) |
| Статус | Needs Decision |
| Release 1 | Core local policy; Interstate lanes позднее |
| Описание | Определить допустимые type/lane/operation/document сочетания без изменения утверждённого Order-owned movement_type. |
| Бизнес-правило | Order-owned movement_type сохраняется. Branch и Warehouse — один бизнес-объект текущего scope (BD-03). Local/Same Day не выводятся из Branch; Interstate lane matrix отложена. |
| Пользователь / роль | Dispatcher/Operations; операционный пользователь читает projection |
| Предусловия | Утверждён источник классификации и справочники. |
| Основной сценарий | Кандидат: назначить movement на Order → отобразить read-only projections → применять agreed eligibility. |
| Альтернативные сценарии | Same Branch допускает local types по явному назначению; interbranch rules требуют решения. |
| Исключения / ошибки | Несовместимый type/assignment не проходит согласованную проверку; UI selector не нормативный master. |
| Связанные сущности | Order movement_type, Branch, Warehouse, RouteRun, Trip |
| Источник | [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [cargoDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/cargoDomain.ts); [interstateDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/interstateDomain.ts); [Baseline](../PROJECT_BASELINE.md) ; [Согласованные BD](RELEASE_1_DECISIONS.md), owner 2026-10-16 |
| Нерешённые зависимости | OQ-02, OQ-03 |

- **FR-049-AC1:** Ни Task, ни RouteRun не становятся вторым владельцем movement_type.
- **FR-049-AC2:** После согласования lane matrix каждый допустимый/недопустимый вариант имеет проверяемый исход.

### FR-050

**Ownership и реальные связи**

| Поле | Требование |
|---|---|
| Module / Workflow | Integrations boundary / [UC-18](WORKFLOWS_AND_USE_CASES.md#uc-18) |
| Статус | Needs Decision |
| Release 1 | Core границы; mapping/контракты Needs Decision |
| Описание | Зафиксировать владельцев/ID/направления обмена Order/Task/Trip/Vehicle/doc/media/communications. |
| Бизнес-правило | Маршрут приходит из Spoke API; планирование у диспетчера вне Mobile App; operational facts и документы — контур Zaberman. Master всех остальных полей/объектов, стабильные ключи и обратная запись в Spoke ещё требуют контрактов. |
| Пользователь / роль | Product/IT; пользователи получают согласованные данные |
| Предусловия | Production scope и владельцы источников подтверждены. |
| Основной сценарий | Кандидат: читать plan из выбранного master, писать operational facts владельцу, показывать подтверждённый результат. |
| Альтернативные сценарии | Separate barcode проект остаётся независимым до согласованного обмена; transition legacy требует решения. |
| Исключения / ошибки | Нельзя считать fixture import живым обменом; один факт не имеет двух конкурирующих masters. |
| Связанные сущности | Source identity, ExternalID, Order/Task/Trip, Integration outcome |
| Источник | [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [Baseline](../PROJECT_BASELINE.md); [OpenAPI POC](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/backend/openapi.yaml) ; [Согласованные BD](RELEASE_1_DECISIONS.md), owner 2026-10-16 |
| Нерешённые зависимости | OQ-03, OQ-08, OQ-11, OQ-13 |

- **FR-050-AC1:** Для каждого включённого объекта есть утверждённый master и immutable external mapping.
- **FR-050-AC2:** Ошибка/повтор обмена не создаёт второй бизнес-факт; API payload design остаётся следующему этапу.

## Data requirements на уровне бизнеса

Имена полей ниже помогают сверить source; это не обязательные DTO, таблицы или PostgreSQL columns. Обязательность означает условие конкретного процесса. Поля, перечисленные как target/Proposed, отсутствуют либо неполны в reference. Их включение и validation требуют указанных OQ. Data clauses являются детализацией указанных FR/NFR, не отдельными дополнительными требованиями вне RTM.

| Сущность / связи | Атрибуты и смысл | Обязательность / validation / lifecycle | Требования и источник |
|---|---|---|---|
| Order → tasks, operations, places, documents | Business order reference; external/internal name; Qty, source, Special Cargo/details, note, Requirements; movement_type | Order reference связывает данные; production immutable internal/external ID и namespace — OQ-03. Reference digit normalization не универсальное правило IDs. Internal name до 80; недоступные сведения с комментарием BD-09; Qty не встраивается в name | FR-005/006/040/049/050; Stage 0 PD-007/008/012/014 |
| Task / Stop → Order, route context | stopId, sequence, operation pickup/dropoff, time, address, externalId; task status в старом Task enum | Требуется конкретный stop/operation для точного контекста. Live status/assignment/cancel и source_version не специфицированы; не смешивать UI status и handoff completion | FR-002–004/007/008; spokeDomain, domain |
| RouteRun → Order/tasks | Контекст связанных local операций, movement projection | Concept Confirmed; конкретные атрибуты пар/assignment/cancellation и completion — Needs Decision. SpokeRoute fixture не объявляется полноценным RouteRun aggregate | FR-040/041/049; baseline |
| PickupDraft → Order + mode | orderNumber, standard/supplemental, pickupDate, branch pair, responsible, packaging, comment, places, photos, history, created/updated timestamps | Draft может быть неполным; перейти к review только после FR-014. Standard и Supplemental разных ключей; updatedAt/revision необходимы для проверки актуального review | FR-011–015; pickupDraftDomain/Store |
| DimensionGroup → places | Group identity, Qty, L/W/H, weight per place, unknownReason, notMeasurable | Qty положительное целое; reference clamp 1..999 не load target. L/W/H/weight известны >0 либо nullable; reason для incomplete/unknown. Это operational grouping, не OrderItem/SKU модель | FR-012/013; measurementDomain |
| CargoPlace → Order, optional Trip | Immutable identity, alias, display n/N, group, measurements, weight source, status/location, events | Primary ID UUIDv7 принят target; human ZB code — prototype. n/N может меняться в текущем представлении, не идентичность. Новые места не получают IDs удалённых | FR-012/029/030/034; cargoDomain, PD-009 |
| Measurement / Totals | Dimensions state complete/partial/unknown/not_measurable, known dimensions, reason; weight value/source; counts incomplete/unknown | Прототип вычисляет часть state из значений; target explicit quality PD-011. Volume только при полных L/W/H; показатели known-only, не фиктивные нули. Units in/lb/cu ft — reference | FR-013, NFR-019; Stage 0/cargoDomain/measurementDomain |
| Branch / Warehouse / Direction | Reference codes NJ1, CA1, CA2, TX1, FL1, AL1; origin/destination; organizational scope отдельно от physical location | Branch=Warehouse в текущем бизнес-scope по BD-03; source IDs/master/статусы — OQ-03. Reference Interstate не допускает одинаковых кодов, но full lanes policy отсутствует | FR-035/049/050; cargoDomain/interstateDomain |
| Vehicle / Driver / User | Vehicle label, truck selection; responsible/signer; user capability/scope, assignment | Пример Van08 и truck list — fixtures. Нужны подтверждённые sources/identity, а не строки как authoritative user/vehicle key; полный доступ BD-06, session/source и vehicle recovery — OQ-06/12 | FR-009/010/017/048; inspection domains/PD |
| Inspection / Vehicle cycle | Pre/Post answers, issue notes, пять photo-view markers, attested, completedAt; paired history; unfinishedStops | Pre все Pass; Post Issue с reason допускается; Post после Pre; новый cycle сохраняет предыдущую пару. Физические media/actor binding — production gap | FR-009/010; inspection domains |
| Order eBOL → Order | status, pickup/delivery handoff snapshots, pickupSupplements, created/updated time | Один document lifecycle на Order. Reference statuses draft/pickup_review/pickup_locked/in_transit/delivery_review/completed/correction_requested — declared vocabulary, не доказательство active flow каждой ветки | FR-016/022/023/043; orderEbolDomain |
| HandoffSnapshot / SupplementalVersion | Evidence, contact/driver confirmations, separate comments, lockedAt; supplement version/documentNumber, addedPlaceIds | Snapshot одной передачи immutable после lock; draft supplements не effective confirmed cargo. Evidence freeze checkpoint — OQ-08. Не объявлять immutable после первой подписи уже реализованной гарантией | FR-015–019/022/024; orderEbolDomain |
| EvidenceSnapshot → places/photos/order details | capturedAt/sourceDraftUpdatedAt, placeIds, piece/weight/volume totals, measurements quality, photo IDs, damage/exception, history | Содержимое версии фиксируется и не заменяется current Order projection; original и additions раздельны. Partial/refused shape пока неизвестен | FR-014–024/028; orderEbolDomain |
| Confirmation / OTP state | signer name, method/status, confirmedAt; masked phone last4; optional emailCopyRequest; reference attempts/sends | Contact signature/OTP + driver signature. Production signer identity, challenge reference, expiry/delegation/checksum — Needs Decision по OQ-06/08. Код OTP в документ не записывается; bitmap подписи reference не сохраняет | FR-017–019/026, NFR-011/015; Stage 0/OTP domain |
| Photo → Order/handoff/version | Reference id, category, source camera/gallery/fixture, asset index; target file identity/storage reference и capture metadata | Asset index — mock, не URL реального evidence. Production author/time/size/checksum/MIME/upload state/retention policy — Proposed, требует OQ-05. Связи с версией обязательны по immutable evidence | FR-027/028, NFR-007/008 |
| Label / PrintAttempt → PlaceID/version | Payload, alias/display, selected IDs, printer/result/time, reprint | Identity неизменна; print status отдельный факт от generated label. Последние 20 attempts — reference storage cap, не retention requirement. Replacement/revoke lifecycle — OQ-09 | FR-030–032; labelPrintStore/Stage 0 |
| Trip / Loaded manifest → places | tripId, direction, truck, order/place counts, known weight/volume, createdAt, BOL ref; target confirmed manifest version/place membership | AS-IS generated Trip — totals, selected IDs отдельно in memory; incoming fixture имеет manifest array. Target обязан сверять confirmed состав по принятым правилам; final ownership/version/creation checkpoint — OQ-03/08 | FR-035–038; interstateDomain/Store, GAP-14 |
| ReceiveDraft / Discrepancy → Trip/PlaceID | received IDs, missing computed against manifest; completed Trip marker в reference | Persisted receiving draft существует, отдельный authoritative Discrepancy lifecycle отсутствует. Case reason/resolution/actor/close requirements — Needs Decision, не новая БД схема | FR-037/038/042; UnloadingScreen/Store |
| DocumentVersion / POD / BOL | document key/number/title, snapshot/version and stage; BOL Trip relation; action attempts/recipients/results | POD — projection completed eBOL. Reference numbering/sample date не production rules; actual PDF/storage/delivery, retention и void — OQ-08 | FR-023–026/039; orderDocumentDomain/BOL screens |
| Communication → Order/thread | Message ID/text/sender/time/direction/read/delivery status; call presentation states | Reference corporate sender/sample contact не master. Target provider refs/receipts/retention/authorization — Needs Decision; audio recording не в scope | FR-044/045; communicationDomain |
| Operational event / sync entry | operation ID, entity/evidence reference, revision/fingerprint, pending/sync/retry/conflict/rejected; actor/device/source/time в target | Reference fingerprint/revision не full sync protocol. Original occurrence time отдельно от receipt time — принятая target event дисциплина; exact schema/version/order/TTL — OQ-07 | FR-046, NFR-001–006/015/019; Stage 0/POC |

### Расчёты и точность

Для групп с полными размерами: V = Σ(Qᵢ × Lᵢ × Wᵢ × Hᵢ) / 1728 cu ft; total piece count = ΣQᵢ; known total weight = Σ(Qᵢ × wᵢ) для известного веса места. При неизвестных данных отдельные incomplete/unknown counts сохраняют смысл known-only. Вес в legacy record может распределяться от общего веса; источник должен быть виден, его нельзя переименовать в measured.

Reference округляет объём до двух десятичных знаков, draft weight — до одной, Interstate summary weight — до целого; это различие представлений, а не разрешение терять точность данных. Для production единицы импорта, precision, округление документа/этикетки и handling overflow требуют согласования в OQ-03/08/10 (GAP-18). Проверочные примеры: Q=3, 24×24×36 → 36.00 cu ft, w=18 →54 lb; при Q=4 →48.00 cu ft и 72 lb. При неизвестной L объём группы не включён в известный итог; reason обязателен перед review. Неизвестный вес не равен 0 lb измеренного веса.

### Источники и временные данные

Нельзя использовать display Order number, row number, fixed sample Trip/BOL number или clock minute как доказательство уникальности физического факта. Target namespaces/keys/idempotency уже частично приняты Stage 0/POC; migration и backwards compatibility требуют решения, а не изменения прототипа. Исторические изображения и fixtures помогают объяснить UI, но не являются production данными, SLA или разрешением на реальные отправки.

## Валидация и общая обработка ошибок

| Контроль | Подтверждённая граница | Связь |
|---|---|---|
| Контекст Order/stop/revision | Нельзя подтвердить чужой заказ/stale review; выбор нового Order явный | FR-002/014/020 |
| Pickup readiness | Сохранённый draft, достоверный контекст Order/places; недоступные сведения/фото с обязательным комментарием BD-09, без выдуманных значений | FR-011–014 |
| Damage | Exception reason обязателен при damage; damage не блокирует handoff при evidence | FR-017/021/022 |
| Signing | Verified contact signature/OTP + driver; без review/locked prerequisites подпись не принимается | FR-016–019/022 |
| Supplemental | Новые IDs/version; unsigned additions блокируют Delivery confirmation | FR-015/020/021 |
| Loading/receiving | Проверка membership; duplicate не удваивает, unknown не меняет состав; missing requires acknowledgment | FR-034–038 |
| Storage/sync failure | Не объявлять сохранение/подтверждение, которого не произошло; сохранить возможность retry; серверные гарантии отдельно | FR-011/021/046, NFR-001–006 |
| Permissions/provider/device failures | Требуется согласованная policy и acceptance, нельзя заменить локальным success | FR-048/050, NFR-009–014/016 |

## Условия завершения и передача

Этот проект ТЗ включает 50 FR, 20 NFR, 140 AC, 18 UC и RTM. Текущий результат — конкретное пошаговое задание команде разработки. Получение доступов, проверка API/оборудования и технические исследования выполняются командой в ходе реализации и не являются условиями завершения или передачи ТЗ. Вопросы RQ/OQ уточняются по мере возникновения; до ответа используется только явно отмеченная рекомендуемая основа без подмены её утверждённым решением. Если вопрос затрагивает конкретную операцию, команда согласует этот участок с owner, продолжая независимые работы.

Порядок выполнения, результат каждого шага и критерии проверки заданы в [пошаговом задании](DEVELOPMENT_PLAN.md#пошаговое-задание-команде). Готовность документации к передаче определяется описанием scope, действий, ожидаемых результатов, зависимостей, AC и явно отмеченных допущений. Она не означает готовность production-системы, проверку интеграций или окончательное согласование всех деталей. Mock constants не являются production требованиями.
