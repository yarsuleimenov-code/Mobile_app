# План реализации mobile-first wireframe Zaberman

## 1. Цель, scope и минимальный готовый результат

### Цель

Подготовить mobile-first wireframe, который позволяет согласовать единый рабочий интерфейс Zaberman до выбора технологии и разработки. Прототип должен ответить на основной ежедневный бизнес-вопрос: как сотрудник быстро начинает Pickup или Dropoff, фиксирует фактические места и завершает локальную операцию без потери данных. Interstate Loading, Unloading и BOL должны оставаться отдельным дополнительным контуром только для соответствующих направлений и рейсов.

### Рекомендуемый scope прототипа

Включить:

- авторизацию, выбор рабочего контекста и ролевые ограничения;
- главный экран с быстрыми действиями `Start Pickup` и `Start Dropoff`;
- назначенные задачи Pickup/Dropoff, local routes и вторичный interstate-контур;
- типы движения `local_standard`, `local_same_day`, `interstate`, `interbranch_transfer`;
- создание и редактирование грузовых мест;
- размеры, вес, объем, упаковку, фотографии и комментарии;
- QR/штрих-код, сканирование и ручной fallback;
- частичное выполнение, расхождения и подтверждение завершения;
- BOL в контексте interstate Trip: preflight, формирование, статус, просмотр и версии;
- offline-черновики, очередь синхронизации, retry, конфликты и ошибки;
- историю действий по месту, заказу, локальной операции/RouteRun и interstate Trip.

Не включать:

- production UI, backend, базу данных и интеграции;
- production-выбор PWA/cross-platform/native технологии; стек самого wireframe определяется отдельно в разделе 11;
- детальный visual design/брендинг;
- миграцию или изменение Telegram-бота, Loading Control и BOL Generator;
- полноценную desktop-админку.

### Минимальный готовый результат

Один связанный кликабельный mobile-first прототип для экрана шириной 360–390 px, в котором можно пройти минимум десять проверочных сценариев:

1. Быстрый старт Pickup с Home и выбор назначенной задачи/OrderID.
2. Local standard Pickup без расхождений с созданием мест, фото и этикеток.
3. Частичный Pickup или Pickup с неизвестным весом/размерами.
4. Быстрый старт Dropoff с Home и завершение без расхождений.
5. Dropoff с проблемой или отказом получателя.
6. Same Day: `Pickup → локальная перевозка → Dropoff` в одном RouteRun при двух самостоятельных операциях.
7. Работа Local Pickup/Dropoff без сети с последующей синхронизацией и конфликтом.
8. Interstate Loading/Unloading по TripID с корректными и проблемными местами.
9. Формирование и просмотр BOL внутри interstate Trip, включая ошибку preflight и новую версию.
10. Interbranch transfer CA1 ↔ CA2 с явно неутвержденным набором Loading/Unloading/documents.

Для каждого основного экрана должны быть показаны happy path, offline/pending и релевантное error/empty state. Прототип не должен имитировать успешную серверную фиксацию, если операция сохранена только на устройстве.

## 2. Рекомендуемая продуктовая концепция

Большинство мест обрабатывается без interstate-рейса, поэтому рекомендуется единое приложение с operation-first главной страницей: крупные действия **Start Pickup** и **Start Dropoff**, актуальные задачи и постоянное действие **Scan**. Local Pickup/Dropoff — первый уровень интерфейса. Interstate — вторичный раздел, доступный через назначенную задачу или `More → Interstate`. Не следует строить изолированные мини-приложения или копировать пошаговую структуру Telegram-бота.

Основные принципы:

- `CargoPlace` — единица физического учета и сканирования, но связь с interstate Trip необязательна;
- Pickup и Dropoff — основные самостоятельные операции с общей историей места;
- `movement_type` хранится отдельно от origin/destination и принимает минимум `local_standard`, `local_same_day`, `interstate`, `interbranch_transfer`;
- local direction только ограничивает допустимые типы движения и не определяет Same Day автоматически;
- Same Day связывает отдельные Pickup и Dropoff общим локальным `RouteRun`, не добавляя manifest, Loading, Unloading или BOL;
- Loading работает по заранее созданному TripID и ожидаемому плану, а подтвержденный манифест содержит только фактически загруженные места;
- Unloading сверяется с подтвержденным loading manifest, а не с исходным заказом;
- BOL использует подтвержденный manifest snapshot и не меняет складской факт при ошибке документа;
- любое полевое действие сначала получает понятный локальный результат, затем отдельный статус синхронизации;
- крупные touch-targets, минимум ручного ввода, работа одной рукой и в перчатках;
- ошибочный scan не должен уводить пользователя с текущего процесса.

Что сохранить из реализованных решений для interstate-контура:

- manifest-driven направления NJ1 ↔ CA1 и NJ1 ↔ CA2 вместо прежней укрупненной пары NY ↔ CA;
- manifest-driven Loading/Unloading;
- partial loading, remaining places и явное закрытие операции;
- создание missing только после подтвержденного Close;
- независимую очередь BOL, retry, registry и reconciliation;
- поиск, фильтры, прогресс и заметный pending indicator;
- операционную временную зону `America/New_York` как временное правило до отдельного решения.

### Классификация направлений и движения

| Направление | Допустимый `movement_type` | Loading/Unloading | BOL |
|---|---|---|---|
| NJ1 → CA1 | `interstate` | Да | Да, в контексте Trip |
| CA1 → NJ1 | `interstate` | Да | Да, в контексте Trip |
| NJ1 → CA2 | `interstate` | Да | Да, в контексте Trip |
| CA2 → NJ1 | `interstate` | Да | Да, в контексте Trip |
| NJ1 → NJ1 | `local_standard` или `local_same_day` | Нет | Нет |
| CA1 → CA1 | `local_standard` или `local_same_day` | Нет | Нет |
| CA2 → CA2 | `local_standard` или `local_same_day` | Нет | Нет |
| CA1 → CA2 | `interbranch_transfer` | Открытый вопрос | Открытый вопрос |
| CA2 → CA1 | `interbranch_transfer` | Открытый вопрос | Открытый вопрос |

Рекомендуется одно каноническое поле `movement_type`. Если во внешней системе уже существует `service_type`, до реализации нужно определить маппинг и не хранить два конкурирующих источника классификации. Выбор Same Day выполняет dispatcher/назначающий процесс явно; приложение не выводит его только из совпадения филиалов.

Что не переносить:

- plaintext password, псевдосессию из `localStorage` и workflow-коды вместо ролей;
- `OrderID + PieceNumber` как единственный идентификатор места;
- ручные toggles как основной способ учета;
- row number, CSV и mutable boolean как бизнес-ключи/историю;
- полный вес заказа для частичной отправки;
- minute-based TripID/ReceivingID;
- one-version BOL и отсутствие correction/void;
- зависимость мобильного UI от Google Sheets schema.

## 3. Пользователи и основные рабочие сценарии

| Пользователь | Основная задача | Критичный сценарий | Основное ограничение |
|---|---|---|---|
| Warehouse employee | Принять, измерить, упаковать и маркировать место; при необходимости загрузить/выгрузить interstate truck | Ежедневный Pickup; вторично Loading/Unloading | Только разрешенный склад и назначенные операции |
| Driver | Видеть назначенный local RouteRun или interstate Trip и подтверждать handoff | Same Day route; Trip summary/BOL для interstate | Не изменяет состав interstate manifest без отдельного разрешения |
| Delivery crew | Выполнить Pickup/Dropoff, фотофиксацию и POD | Работа на адресе клиента | Только назначенные задачи и связанные места |
| Crew lead / бригадир | Подтвердить фото, повреждения, документы и исключения на точке | Pickup/Dropoff review | Роль из Telegram-ТЗ требует маппинга на целевую модель |
| Warehouse supervisor | Обработать local/interstate исключения и подтвердить Close Loading/Unloading | Проверка расхождений, override | Все override требуют причины и записи в истории |
| Dispatcher / operations manager | Назначить Pickup/Dropoff, выбрать `movement_type`, создать local RouteRun или interstate Trip | Same Day coordination; interstate preparation/BOL | Не подменяет физические scan events |
| Administrator | Управлять пользователями, ролями, справочниками и устройствами | Access/device support | Не выполняет операции по умолчанию |

Рекомендуемая модель доступа — permissions + scope, а не одна жесткая роль. Один сотрудник может быть warehouse employee и supervisor на конкретном складе. Scope: филиал, назначенные задачи/RouteRun/Trip и допустимые действия. Для большинства пользователей Home и Tasks открывают Pickup/Dropoff; interstate permissions не должны усложнять ежедневный local flow.

## 4. Общая терминология и данные, которые должен отражать wireframe

| Сущность | Назначение в интерфейсе | Обязательные связи/поля для прототипа |
|---|---|---|
| Order | Коммерческий заказ | OrderID, клиент/контакт, адреса, плановые items/places, status |
| Task | Самостоятельная Pickup или Dropoff операция | type, movement_type, assignee/team, time window, address/branch, status |
| CargoItem | Предмет/содержимое заказа | description, quantity; связь с одним или несколькими places |
| CargoPlace | Физическая единица учета | global PlaceID, OrderID, sequence, L/W/H, volume, actual/declared weight, package type, photos, status, location |
| RouteRun | Локальный рейс, включая Same Day | RouteRunID, movement_type, vehicle/crew, Pickup task IDs, Dropoff task IDs, status |
| Trip | Только interstate рейс | unique TripID, route, truck, driver, planned/actual time, status |
| Manifest | Плановый и подтвержденный состав только interstate Trip | manifest version, expected places, confirmed loaded places |
| PlaceEvent | Неизменяемое действие | type, place, operation, occurred time, user, device, sync status |
| Discrepancy | Расхождение по месту/операции | missing, extra, damaged, wrong trip, refused, label issue; lifecycle |
| Media | Фото или документ | category, related Order/Place/Task/RouteRun/Trip, author, time, upload/sync status |
| Document | BOL/POD/внешний BOL | number, type, version, lifecycle, file status/link |

Правила отображения CargoPlace:

- QR — рекомендуемый основной носитель глобального `PlaceID`; Code 128 — кандидат для совместимости со сканерами;
- человекочитаемая часть этикетки показывает OrderID, номер места `n/N` и короткий PlaceID;
- размеры и вес показывают источник: `Declared`, `Measured` или `Unknown`;
- объем рассчитывается как `L × W × H / 1728` cu ft при размерах в inches;
- total weight/volume операции считаются только по местам, фактически включенным в нее;
- фото разделяются на item, packaging, condition, damage, Pickup, Dropoff, external BOL и POD;
- замена этикетки создает новый code alias, но сохраняет прежний PlaceID и историю reprint.
- CargoPlace связывается с Order всегда, с Task/RouteRun — по текущей локальной операции, с interstate Trip — только если место включено в его manifest.

## 5. Навигация и карта экранов

### Рекомендуемая навигация

Нижняя навигация для полевых ролей:

```text
Home | Tasks | Scan | More
```

- **Home** — крупные `Start Pickup` и `Start Dropoff`, следующие задачи, активный Same Day RouteRun и attention states.
- **Tasks** — назначенные Pickup/Dropoff, фильтры Local/Same Day/Interstate и история выполнения.
- **Scan** — контекстное сканирование; без выбранной операции предлагает найти место/заказ или продолжить активную задачу.
- **More** — Sync Center, history, device/printer, смена контекста, secondary `Interstate` и logout.

Верхняя панель постоянно показывает branch/role context и состояние сети/очереди. Недоступные разделы скрываются или открываются read-only в зависимости от permissions. После входа пользователь попадает на Home; начать Pickup/Dropoff можно одним нажатием, затем выбрать назначенную задачу, отсканировать/ввести OrderID или продолжить черновик.

### Состав экранов

| ID | Экран | Назначение и ключевые действия |
|---|---|---|
| A01 | Sign in | Вход; online-required first login; понятные auth/permission errors |
| A02 | Work context | Выбор активной роли, склада/команды; показ области доступа |
| H01 | Home | `Start Pickup`, `Start Dropoff`, Resume, next tasks, active Same Day, sync/attention |
| H02 | Task list | Today/Upcoming/Attention, поиск OrderID, фильтры operation/movement/status |
| H03 | Task detail | Адрес, контакт, movement type, plan, history preview, Start/Resume |
| P01 | Pickup checklist | Прибытие, контакт, expected vs actual, прогресс шагов |
| P02 | Items & places | План/факт items, создание/разделение/добавление CargoPlace |
| P03 | Place details | Dimensions, weight, package type, description, validation |
| P04 | Photo checklist | Категории фото, required/warning counters, damage capture |
| P05 | Label | QR/barcode preview, print/save, reprint/replace label, scan test |
| P06 | Pickup review | Сводка, incomplete/partial/refused, confirmation and handoff |
| D01 | Dropoff reconcile | Expected places, scan progress, pickup reference photos |
| D02 | Dropoff exception | Missing/extra/damaged/refused, note and evidence |
| D03 | Recipient/POD | Recipient name, optional signature/confirmation, delivery photos |
| D04 | Dropoff review | Итог перед completion; local vs server-confirmed state |
| R01 | Same Day route | Последовательность Pickup/Dropoff tasks, crew/vehicle, общий прогресс |
| R02 | Local handoff | Места текущего RouteRun и переход к следующей самостоятельной операции |
| T01 | Interstate trips | Secondary список Assigned/Arriving/Attention/Closed |
| T02 | Interstate trip detail | Overview, manifest, Loading/Unloading, discrepancies и BOL |
| L01 | Loading scan | Scan-first loop, expected result, progress, recent scans |
| L02 | Loading exception | Wrong trip, extra, damaged, unreadable label, supervisor action |
| L03 | Close Loading | Confirmed/missing/extra/damaged totals; supervisor confirmation |
| U01 | Unloading scan | Scan against confirmed loaded manifest; destination context |
| U02 | Unloading discrepancy | Missing/extra/damaged with photo/note and lifecycle |
| U03 | Close Unloading | Reconciliation, warehouse/location update, supervisor confirmation |
| B01 | BOL preflight | Missing fields, actual totals, parties, manifest version |
| B02 | BOL generation status | Waiting for sync, queued, generating, retry, failed, generated |
| B03 | Trip BOL history | Версии и lifecycle только выбранного interstate Trip |
| B04 | Document detail/viewer | Preview, download, print/share, version history, signed copy |
| S01 | Sync Center | Pending/syncing/failed/conflict groups, dependency order, retry |
| S02 | Conflict review | Local vs server value/event, recommended action, supervisor route |
| X01 | Discrepancy queue | Open/assigned/resolved issues with owner and aging |
| X02 | Place/operation history | Append-only timeline with user/device/original and sync times |
| M01 | Device & printer | Camera/scanner/printer status, label test, offline storage status |
| M02 | Admin access summary | Users/permissions/devices reference; detailed admin UI is later scope |

Не создавать отдельный экран на каждый Telegram-вопрос. P01–P06 и D01–D04 должны использовать короткие секции, cards, step indicator и inline validation, чтобы основной сценарий укладывался в 2–3 минуты без учета физической упаковки и съемки. Не добавлять глобальный раздел Documents: POD доступен из Dropoff/Order history, BOL — только из interstate Trip.

## 6. Детальные процессы

### 6.1 Pickup

**Вход:** `Home → Start Pickup`, назначенная Pickup task или Resume draft. После быстрого старта пользователь выбирает задачу, сканирует/вводит OrderID; адрес и плановые данные получаются из master system. Ручной ввод OrderID — fallback с проверкой существования, а не фиксированное правило «ровно 8 цифр».

1. Открыть задачу, проверить адрес/контакт, отметить `Arrived`.
2. Сверить плановые items и фактический состав: same, missing, extra, refused.
3. Указать фактическое количество мест; создать CargoPlace для каждого физического места.
4. Для каждого места внести L/W/H, weight source/value, package type и описание. Unknown разрешается только с причиной.
5. Сделать required photos по configurable checklist; damage требует фото и комментарий.
6. Сгенерировать label, распечатать/сохранить и выполнить контрольный scan. При offline PlaceID должен быть создан безопасно и помечен как pending sync.
7. Просмотреть сводку order/place totals и незавершенные поля.
8. Выбрать Complete, Partial, Refused или Save draft. Complete формирует локальное событие; окончательный статус `Synced` появляется после подтверждения сервера.

**Обязательные варианты wireframe:** extra item, повторный Pickup, неизвестный вес, невозможность измерить, менее рекомендуемого количества фото, повреждение, нет принтера, duplicate/replaced label, offline completion.

### 6.2 Dropoff

**Вход:** `Home → Start Dropoff`, назначенная Dropoff task или следующий шаг активного Same Day RouteRun. Expected places берутся из актуального состава заказа; Pickup reference data доступен read-only.

1. Открыть задачу и увидеть expected count, pickup photos и known damage.
2. Сканировать каждое передаваемое место; успешный scan сразу обновляет прогресс.
3. При wrong order/duplicate/unknown code показать inline result и не менять expected count.
4. Зафиксировать missing, extra, new damage или client refusal с фото/комментарием.
5. Сделать delivery photos; показать checklist, а не универсальный hardcoded минимум.
6. Получить recipient confirmation: имя и выбранный бизнесом способ подписи/подтверждения.
7. Сформировать POD preview и выполнить Complete/Partial/Refused.

Pickup и Dropoff не объединяются в один статус: между ними могут быть другие даты, пользователи, транспорт и складские события. Даже для Same Day завершение Pickup не означает начало или завершение Dropoff.

### 6.3 Local standard и Same Day

#### `local_standard`

- Pickup и Dropoff доступны как ежедневные самостоятельные задачи.
- Операции могут выполняться в разные дни и не обязаны иметь общий RouteRun.
- Места связываются с Order и соответствующей Task; interstate Trip, manifest, Loading, Unloading и BOL не создаются.
- После Pickup место получает следующий локальный status/location, но UI не имитирует interstate handoff.

#### `local_same_day`

**Вход:** dispatcher явно назначил `movement_type = local_same_day` и создал RouteRun с Pickup и последующим Dropoff.

1. На Home показать активный Same Day card: route/crew/vehicle, выполненные и следующие операции.
2. Открыть самостоятельную Pickup task и пройти обычный Pickup flow.
3. После server-confirmed Pickup вернуть пользователя в RouteRun, показать полученные places и действие `Continue route`.
4. Этап `Локальная перевозка` показывает статус `In transit`, но не требует interstate Loading, Unloading или manifest.
5. В нужной точке открыть самостоятельную Dropoff task; expected places берутся из завершенного Pickup в том же RouteRun с учетом подтвержденных корректировок.
6. Пройти обычный Dropoff flow и сформировать POD при необходимости.
7. RouteRun становится `Completed`, когда обязательные Pickup/Dropoff tasks завершены и синхронизированы.

**Обязательные варианты wireframe:** несколько заказов в RouteRun, частичный Pickup, пропущенный Dropoff, изменение очередности, offline-переход между операциями, reassignment crew. Same Day не определяется автоматически по NJ1 → NJ1/CA1 → CA1/CA2 → CA2; пользователь должен видеть явно назначенный service/movement type.

### 6.4 Interstate Loading

**Вход:** dispatcher заранее создал Trip с уникальным TripID, route, truck и expected manifest. Это заменяет текущую модель, где TripID появляется только после нажатия Generate Trip.

1. Выбрать assigned Trip и проверить route/truck/warehouse.
2. Открыть expected manifest: expected, loaded, remaining, issues, weight/volume.
3. Сканировать place в непрерывном scan loop.
4. На сервере или по cached manifest проверить принадлежность Trip/route и текущее состояние.
5. Для expected place создать LoadEvent; duplicate scan показать как `Already loaded`, не дублировать событие.
6. Wrong trip блокировать по умолчанию; supervisor может выполнить обоснованный override либо переназначение до Close.
7. Damage/extra/unreadable label оформить как discrepancy, не как безымянный manual toggle.
8. Close Loading показывает confirmed places, remaining, missing/extra/damaged и фактические totals. Supervisor подтверждает partial/complete closure.
9. Зафиксировать immutable manifest version. Запрос BOL отправляется независимо; ошибка BOL не откатывает Loading.

### 6.5 Interstate Unloading

**Вход:** arriving Trip и confirmed loading manifest version.

1. Выбрать прибывший Trip; truck берется из Trip и не заменяется произвольным client value.
2. Убедиться в destination warehouse и открыть manifest.
3. Сканировать места; UnloadEvent фиксирует место, пользователя, устройство, исходное время и destination.
4. Extra/wrong trip блокируется или отправляется supervisor на review; damage требует evidence.
5. При Close все unreceived expected places становятся draft Missing discrepancies.
6. Supervisor проверяет сводку и подтверждает атомарное завершение: unload events, closed status, discrepancies и новое location/status places.
7. Если closure ожидает сеть, UI показывает `Ready to close — waiting for sync`, а не `Closed`.

### 6.6 BOL и interstate-документы

1. Из конкретного interstate Trip открыть `BOL`. Глобального ежедневного BOL/Documents раздела нет. После Close Loading система может автоматически поставить generation request в очередь; уполномоченный пользователь также видит ручной Generate/Retry.
2. Preflight проверяет manifest version, фактические quantity/weight/volume, shipper/carrier/receiver, dates и обязательные реквизиты.
3. Ошибки показываются списком с переходом к источнику; placeholder не считается заполненным значением.
4. Generation status: waiting for upstream sync → queued → generating → generated или retry/failed.
5. Generated PDF открывается в приложении; доступны download, print и share согласно permission.
6. Registry показывает BOL Number, TripID, source manifest version, document version, lifecycle и signed copy.
7. Correction создает новую версию; прежняя не переписывается. Void требует причины. Signed copy хранится как отдельная версия/файл с аудиторской связью.

В интерфейсе различать:

- внешний/customer BOL, загруженный как фото или файл во время Pickup;
- сгенерированный Interstate BOL по Trip manifest;
- POD по Dropoff.

Для `local_standard` и `local_same_day` interstate BOL не показывается. Для `interbranch_transfer` BOL/другие документы остаются скрытыми за feature/scenario flag до бизнес-решения.

## 7. Роли и доступные действия

| Действие | Warehouse | Driver | Delivery crew | Supervisor | Dispatcher | Admin |
|---|---:|---:|---:|---:|---:|---:|
| Видеть назначенные задачи | Да | Да, рейсы | Да | Да, в scope | Да, операционный scope | По support scope |
| Выполнять Pickup/Dropoff | По назначению | Только с crew permission | Да | Да/override | Нет | Нет |
| Создавать/редактировать place до completion | Да | Нет | Да | Да | Read-only | Support only |
| Выполнять Same Day RouteRun | По назначению | Да, если crew | Да | Да/override | Monitor/reassign | Нет |
| Сканировать Loading/Unloading | Да | Опционально, если разрешено | Нет | Да | Read-only | Нет |
| Close Loading/Unloading | Запросить | Нет | Нет | Подтвердить | Опционально по политике | Нет |
| Выбирать movement type/создавать RouteRun | Нет | Нет | Нет | Ограниченно | Да | Настройка справочников |
| Создавать interstate Trip/назначать truck/crew | Нет | Нет | Нет | Ограниченно | Да | Настройка справочников |
| Создавать discrepancy | Да | Ограниченно | Да | Да | Да, review | Нет |
| Resolve/override discrepancy | Нет | Нет | Нет | Да | Да | Нет |
| Generate/Retry BOL | Read-only или request | View | Нет | Да | Да | Support retry |
| Issue/Void/Archive BOL | Нет | Нет | Нет | По политике | Да | Нет |
| Управлять ролями/устройствами | Нет | Нет | Нет | Нет | Нет | Да |

Каждое скрытое/disabled действие должно иметь объяснимую причину. Interstate actions и BOL не показываются пользователю без соответствующего Trip и permission. Override, изменение после completion, reprint label, void и конфликт требуют reason и записи в history.

## 8. Offline, синхронизация, ошибки и конфликты

### Единые состояния данных

| Состояние | Значение для пользователя | Представление |
|---|---|---|
| Saved on device | Данные не потеряны, но еще не в центральной системе | Серый badge + число pending |
| Waiting for connection | Нет сети | Offline banner, доступен Resume |
| Syncing | Идет отправка | Progress без блокировки следующего независимого действия |
| Synced | Сервер подтвердил | Короткий success state, затем обычный status |
| Retry scheduled | Временная ошибка | Время следующей попытки + Retry now |
| Needs review | Бизнес-конфликт | Amber badge, переход в Conflict review |
| Rejected | Сервер не принял операцию | Red state, причина и безопасное действие |

### Offline-матрица для wireframe

| Функция | Offline | Правило прототипа |
|---|---|---|
| Первый login/смена permissions | Нет | Нужна сеть; ранее подтвержденная сессия может работать ограниченно |
| Просмотр cached tasks/RouteRun/manifests | Да | Показывать время последнего обновления; manifest нужен только interstate |
| Pickup/Dropoff draft и completion request | Да | Сохранить локально с original occurredAt |
| Переход по Same Day RouteRun | Да | Следующая task доступна из cache; server-confirmed статусы визуально отделены |
| Создание PlaceID | Да, условно | Reserved range/UUID policy должна быть утверждена; badge pending |
| Scan Loading/Unloading | Да | Только по cached manifest; неизвестный code не считать подтвержденным |
| Фото | Да | Локальная миниатюра, очередь upload, отдельный retry |
| Печать label | Да, если устройство доступно | Показать printer state и fallback `Save label` |
| Close Loading/Unloading | Подготовить offline | Финальный `Closed` только после server confirmation |
| Generate BOL | Нет как готовый PDF | Можно поставить dependent request `Waiting for sync` |
| Просмотр ранее загруженного BOL/POD | Да | Явно показать cached copy и version |

### Конфликтные сценарии

- Повтор одного `operationId`: автоматически считать уже обработанным, не показывать как ошибку.
- Два устройства изменили dimensions/weight: показать server/local, источник и время; обычный сотрудник может discard/resubmit correction, supervisor — override с reason.
- Same Day Dropoff открыт до подтверждения Pickup: разрешить подготовку/просмотр, но блокировать финальный expected set до reconciliation.
- Manifest изменен после offline scan: не терять события; показать invalidated/added places и провести reconciliation до Close.
- Place уже загружен в другой Trip: блокировать и предложить открыть правильный Trip или запросить supervisor.
- Offline Close пришел после server Close: открыть итоговый server result и отдельно перечислить непримененные локальные события.
- Фото не загрузилось при синхронизированных данных: операция остается завершенной только если photo checklist допускает это; иначе `Needs attention`.
- BOL source изменился после генерации: текущий PDF помечается previous/stale для нового manifest; требуется новая версия, а не перезапись.

## 9. Ошибки и расхождения, которые обязательно показать

| Ситуация | Реакция wireframe |
|---|---|
| Неверный/неизвестный barcode | Не менять прогресс; повторный scan, manual lookup, label issue |
| Place от другого Order/RouteRun/Trip | Блокирующий result card; правильный контекст; supervisor request |
| Duplicate scan | Нейтральное `Already recorded` с временем/пользователем |
| Missing | Создать после review/Close; owner, status, note, history |
| Extra/surplus | Отдельная discrepancy; не добавлять молча в manifest |
| Damaged | Категория, severity, фото, note, known/new damage |
| Client refusal/partial task | Причина, фактический переданный состав, фото/POD state |
| Unknown weight/dimensions | Причина и owner следующего действия; не подставлять zero |
| Camera/scanner/printer unavailable | Manual fallback и device diagnostics |
| Permission denied | Объяснить отсутствующее permission/scope, не просто `Error` |
| Timeout/temporary backend error | Операцию оставить pending; не предлагать создавать дубль |
| Data conflict | Conflict review с рекомендуемым вариантом и audit trail |
| BOL preflight/generation failure | Поле/причина, Retry после исправления, warehouse fact не откатывается |

Минимальный lifecycle discrepancy: `Open → Assigned → Investigating → Resolved` с исходами `Found`, `Accepted variance`, `Returned`, `Damaged confirmed`, `Duplicate/invalid`. Автоматически закрывать discrepancy без ответственного решения нельзя.

## 10. Последовательность реализации wireframe и критерии готовности

### Этап 0. Product baseline и границы прототипа

**Результат:** список утвержденных допущений, route/movement classification, terminology, роли, критичные P0-вопросы и десять test scenarios.

**Готово, если:**

- направления и `movement_type` хранятся отдельно;
- для всех девяти направлений определен допустимый movement type;
- совпадение origin/destination не назначает Same Day автоматически;
- Pickup/Dropoff отделены от RouteRun и interstate Loading/Unloading;
- выбрана единица учета CargoPlace;
- утверждено, кто назначает movement type, создает Same Day RouteRun и interstate Trip;
- согласованы provisional role mapping и permission scope;
- unresolved P0-вопросы имеют owner и дату решения;
- определены source labels для declared/measured/unknown data.

### Этап 1. Главный экран и выбор Pickup/Dropoff

**Результат:** app shell `Home | Tasks | Scan | More`, Home с крупными `Start Pickup`/`Start Dropoff`, task chooser, Resume и базовый wireframe kit.

**Готово, если:**

- Pickup и Dropoff начинаются с Home одним нажатием;
- после quick action можно выбрать назначенную задачу, scan/manual OrderID или Resume draft;
- Scan доступен одним действием;
- active Same Day и attention/pending видимы без открытия More;
- interstate не занимает основной navigation slot;
- состояния loading/empty/error/offline предусмотрены в шаблонах;
- touch-targets рассчитаны на одну руку/перчатки, ручной ввод минимизирован;
- role/context/network видимы без открытия настроек.

### Этап 2. Local standard Pickup и Dropoff

**Результат:** end-to-end `local_standard` Pickup и Dropoff как основные независимые операции, без Trip/manifest/Loading/Unloading/BOL.

**Готово, если:**

- local task показывает branch direction и явно выбранный movement type;
- Pickup и Dropoff имеют собственные статусы и completion;
- Dropoff использует подтвержденные places и Pickup evidence;
- Complete/Partial/Refused имеют разные итоговые состояния;
- local flow нигде не требует TripID, manifest, Loading/Unloading или BOL;
- POD остается в Dropoff/Order context;
- happy path обеих операций укладывается в 2–3 минуты UI-взаимодействия без учета физической работы.

### Этап 3. Same Day RouteRun

**Результат:** R01–R02 и связанный сценарий `Pickup → локальная перевозка → Dropoff`.

**Готово, если:**

- `local_same_day` назначен явно, а не вычислен только по одинаковому филиалу;
- RouteRun показывает crew/vehicle, последовательность задач и общий прогресс;
- Pickup и Dropoff остаются отдельными operations и audit records;
- локальная перевозка не создает interstate manifest/Loading/Unloading/BOL;
- Dropoff ожидает фактически подтвержденные Pickup places;
- partial Pickup, skipped Dropoff, reassignment и offline transition имеют отдельные состояния;
- завершение RouteRun зависит от синхронизированных обязательных tasks.

### Этап 4. CargoPlace, размеры, фото, labels и offline

**Результат:** P02–P05, общие place/media components, Sync Center и local-first state variants для этапов 1–3.

**Готово, если:**

- можно создать несколько places и изменить actual count;
- размеры, weight source и volume логически согласованы;
- photo checklist различает item/package/damage/Pickup/Dropoff;
- label содержит global и human-readable ID, показаны print/save/reprint;
- CargoPlace не имеет обязательного TripID;
- offline draft/resume, photo queue, sync status и validation errors показаны;
- Retry не создает дубль, logout предупреждает о pending данных;
- totals проходят простой тест: два места 24×16×40 дают по 8.89 cu ft и 17.78 cu ft суммарно.

### Этап 5. Interstate Loading и Unloading

**Результат:** T01–T02, L01–L03, U01–U03 как secondary flow из назначенной задачи или `More → Interstate`.

**Готово, если:**

- Trip выбирается до первого scan и показывает route/truck/manifest version;
- только NJ1 ↔ CA1 и NJ1 ↔ CA2 автоматически используют этот flow;
- корректный, duplicate, wrong-trip, damaged и unknown scan имеют разные результаты;
- partial loading показывает confirmed и remaining places;
- Unloading использует только confirmed loaded manifest;
- Close summary формирует missing/extra/damaged и требует нужное permission;
- offline Close не отображается как окончательно завершенный;
- weight/volume totals считаются по фактическим places, а не по полному Order;
- CA1 ↔ CA2 не получает этот flow до отдельного решения.

### Этап 6. BOL и interstate-документы

**Результат:** B01–B04 внутри T02; preflight, queue/status, PDF view и version history.

**Готово, если:**

- BOL открывается только из соответствующего interstate Trip;
- preflight использует фактический manifest и показывает blocking fields;
- различаются customer BOL, Interstate BOL и POD;
- показаны queued/generating/retry/failed/generated states;
- PDF можно открыть, download/print/share доступны по permissions;
- видны BOL Number, TripID, version, lifecycle и signed copy;
- correction создает новую версию, void требует причины;
- ошибка BOL не меняет статус Loading/Trip fact;
- local standard и Same Day не показывают Interstate BOL.

### Этап 7. Ролевая проверка и handoff

**Результат:** связанный кликабельный прототип, index экранов, state matrix и короткий сценарий usability review.

**Готово, если:**

- десять сценариев из раздела 1 проходят от начала до однозначного результата;
- Warehouse, Delivery, Dispatching и IT подтвердили терминологию и права;
- supervisor/admin actions недоступны обычному пользователю;
- на каждом экране понятны объект, операция, прогресс, сеть и следующее действие;
- Local/Same Day сценарии доступны быстрее и заметнее interstate;
- отсутствуют dead ends и недоступные back/resume paths;
- все P0-вопросы закрыты либо явно помечены как блокирующие реализацию;
- прототип содержит annotations: business rule, source assumption, permission, offline behavior и acceptance state;
- сформирован перечень экранов/состояний для последующей поэтапной разработки без необходимости заново проектировать flow.

## 11. Технический план реализации wireframe в репозитории

На этом этапе раздел является только планом. Файлы приложения, зависимости и package scripts не создавать.

### 11.1 Рекомендуемый стек

Рекомендуемый вариант для последующего кликабельного wireframe:

- React + TypeScript + Vite;
- React Router для явных URL каждого сценария;
- CSS variables + CSS Modules без полноценной UI-библиотеки;
- React Context + `useReducer` для mock state и сценариев; не добавлять Redux/Zustand без фактической необходимости;
- статические TypeScript/JSON fixtures и Promise-based mock service без backend;
- `localStorage` только для симуляции draft/queue между reload;
- Vitest для правил классификации/расчетов и Playwright для сценариев на мобильных viewport.

Почему этот вариант рекомендуется: минимальная настройка, изоляция от существующих документов, понятная маршрутизация и достаточная интерактивность для offline/error simulation. Настоящий Service Worker, камера, печать и фоновые задачи на wireframe-этапе не нужны; показываются их состояния и контракты.

### 11.2 Предполагаемая структура файлов

Создать отдельную папку `wireframe/`, не смешивая прототип с audit-документами:

```text
wireframe/
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  src/
    app/
      App.tsx
      router.tsx
      AppShell.tsx
      ScenarioProvider.tsx
    domain/
      types.ts
      movementRules.ts
      permissions.ts
      calculations.ts
    features/
      home/
      tasks/
      pickup/
      dropoff/
      same-day/
      places/
      scan/
      sync/
      interstate/
      bol/
      more/
    components/
      actions/
      cards/
      feedback/
      forms/
      navigation/
    mocks/
      branches.ts
      users.ts
      orders.ts
      tasks.ts
      routeRuns.ts
      trips.ts
      documents.ts
      scenarios.ts
      mockService.ts
    styles/
      tokens.css
      globals.css
    main.tsx
  tests/
    movementRules.test.ts
    calculations.test.ts
  e2e/
    local-standard.spec.ts
    same-day.spec.ts
    interstate.spec.ts
    offline-errors.spec.ts
```

Файлы внутри feature делить только при реальном переиспользовании. Не создавать отдельные service/repository/use-case слои для статического wireframe.

### 11.3 Маршруты прототипа

| Route | Назначение |
|---|---|
| `/` | Home с `Start Pickup`/`Start Dropoff` |
| `/tasks` | Список назначенных задач |
| `/tasks/:taskId` | Карточка Pickup/Dropoff task |
| `/pickup/start` | Выбор task или OrderID для быстрого Pickup |
| `/pickup/:taskId` | Pickup flow с вложенными шагами через state, не отдельными URL |
| `/dropoff/start` | Выбор task или OrderID для быстрого Dropoff |
| `/dropoff/:taskId` | Dropoff flow |
| `/routes/:routeRunId` | Same Day RouteRun и переход между независимыми tasks |
| `/scan` | Глобальный scan/manual lookup |
| `/more` | Secondary actions и settings |
| `/more/sync` | Sync Center/conflicts |
| `/more/history` | Place/operation history |
| `/more/interstate` | Secondary список interstate Trips |
| `/interstate/trips/:tripId` | Interstate Trip detail |
| `/interstate/trips/:tripId/loading` | Loading flow |
| `/interstate/trips/:tripId/unloading` | Unloading flow |
| `/interstate/trips/:tripId/bol` | BOL выбранного Trip, включая версии/viewer |

Отдельный `/documents` не создавать. POD открывается из Dropoff/Order history, Interstate BOL — из `Trip detail`.

### 11.4 Mock-данные и сценарии

Минимальный fixture set:

- branches: `NJ1`, `CA1`, `CA2`;
- все девять направлений и разрешенные movement types;
- по одному пользователю для warehouse, driver, delivery crew, supervisor, dispatcher, admin;
- local standard Pickup и Dropoff с completed/draft/problem вариантами;
- Same Day RouteRun с несколькими orders и последовательностью Pickup/Dropoff;
- CargoPlaces с measured/declared/unknown weight, complete/incomplete dimensions, damage photos и label states;
- interstate Trips для NJ1 ↔ CA1 и NJ1 ↔ CA2 с partial/missing/extra;
- CA1 ↔ CA2 fixture с `interbranch_transfer` и unresolved feature flags;
- BOL generated/queued/failed/versioned только для interstate Trips;
- sync queue, stale data, duplicate operation, permission denied и network timeout.

Каждый scenario preset должен быть детерминированным и сбрасываться одной кнопкой. Mock service возвращает копии данных и управляемые задержки/ошибки, чтобы UI не зависел от случайного поведения.

### 11.5 Переиспользуемые компоненты

- `AppShell`, `BottomNav`, `ContextHeader`;
- `HomeQuickActions`, `ResumeCard`, `TaskCard`, `RouteRunCard`, `InterstateTripCard`;
- `MovementTypeBadge`, `OperationStatus`, `SyncStatusBadge`;
- `PlaceCard`, `PlaceEditor`, `DimensionsInput`, `WeightInput`;
- `PhotoChecklist`, `PhotoTile`, `DamageForm`, `LabelPreview`;
- `ScanPanel`, `ScanResultCard`, `ManualCodeInput`, `ProgressSummary`;
- `OfflineBanner`, `SyncQueueItem`, `ConflictCompare`, `RetryAction`;
- `ConfirmSheet`, `ReasonDialog`, `EmptyState`, `ErrorState`;
- `BolPreflight`, `GenerationStatus`, `DocumentViewerMock` — только внутри interstate feature.

Один компонент не должен содержать одновременно local и interstate business flow. Общими остаются только визуальные примитивы, CargoPlace, scan result, sync и error states.

### 11.6 Симуляция ролей, offline и ошибок

Добавить dev-only `ScenarioPanel`, который не является экраном продукта и позволяет выбрать:

- role и branch scope;
- movement type/scenario preset;
- `online`, `offline`, `slow`, `reconnecting`;
- sync result: success, retryable failure, conflict, rejected;
- scanner/camera/printer available/unavailable;
- BOL state для выбранного interstate Trip;
- reset mock state.

Role simulation должна реально скрывать/disable действия по permission matrix. Offline simulation должна сохранять pending events и фото-метаданные после reload, но не притворяться production offline-first реализацией. Ошибки включаются через scenario preset или dev panel, а не разбросанные query flags в компонентах.

### 11.7 Порядок проверки

1. Unit-проверки: direction → allowed movement types, отсутствие обязательного TripID у local place, volume/totals.
2. Route smoke: каждый URL открывается напрямую и после reload возвращает понятное состояние.
3. Основной ручной viewport `390×844`: Home, Local Pickup/Dropoff и Same Day end-to-end.
4. Базовый viewport `360×800`: все основные и interstate flows, fixed navigation, forms и dialogs.
5. Малый viewport `320×568`: отсутствие горизонтального scroll, перекрытий keyboard/bottom nav и недоступных CTA.
6. Большой Android viewport `412×915`: плотность cards, scan loop и photo grid.
7. Tablet regression `768×1024`: контент остается mobile-width и не растягивается без необходимости.
8. Playwright сценарии: local standard, Same Day, offline/retry/conflict, interstate Loading/Unloading, BOL inside Trip.
9. Ролевая проверка: warehouse/delivery не видят лишний BOL; dispatcher видит movement selection; обычный user не выполняет supervisor override.
10. Финальный responsive pass: portrait-first, 200% text zoom, focus order, keyboard navigation и color-independent statuses.

## 12. Общие критерии готовности прототипа

- Состав экранов покрывает все требования задачи без разработки лишней административной функциональности.
- Для каждого физического места прослеживается применимая цепочка: local `Pickup → локальные события → Dropoff` либо interstate `Pickup → Loading → Unloading → Dropoff`.
- Ни CargoPlace, ни local Pickup/Dropoff не требуют обязательного TripID.
- Home дает более быстрый доступ к Local/Same Day, чем к secondary interstate flow.
- Текущий статус не подменяет историю: Place history показывает исходное время, пользователя, устройство и sync result.
- Partial operations и discrepancies являются штатными сценариями, а не только error popups.
- Все destructive/override actions имеют confirm, reason и audit consequence.
- Данные, сохраненные только локально, визуально не равны данным, подтвержденным сервером.
- Основные scan loops не требуют возвращаться к списку после каждого места.
- Нет универсального hardcoded правила, если исходные документы противоречат друг другу: такие места помечены configurable/decision required.
- Термины Pickup, Dropoff, Loading, Unloading, customer BOL, Interstate BOL и POD не используются взаимозаменяемо.

## 13. Открытые вопросы и противоречия

### P0 — решить до детального прототипирования соответствующего flow

| Вопрос/противоречие | Источник проблемы | Рекомендуемое допущение для wireframe |
|---|---|---|
| Каноническое поле `service_type` или `movement_type` | Нужен отдельный от direction признак | Использовать `movement_type`; при наличии внешнего `service_type` утвердить однозначный маппинг |
| Кто и когда назначает Same Day | Одинаковый branch только допускает, но не определяет Same Day | Dispatcher/источник задачи явно задает `local_same_day` и RouteRun |
| CA1 ↔ CA2 Loading/Unloading/documents | Interbranch-сценарий не описан | Не показывать эти функции по умолчанию; управлять одним decision/feature flag до решения |
| Когда создается interstate TripID | AS-IS создает его после Loading; mobile ТЗ требует выбрать TripID до scan | Dispatcher создает Trip master заранее; Close фиксирует manifest version |
| Master system для Order/Task/RouteRun/Place/Trip | В документах не определен | В прототипе показывать central system как источник, не проектировать ручное дублирование |
| Формат PlaceID и offline generation | QR/Code128/GS1 не выбран | QR с opaque global PlaceID + human-readable Order/place; Code128 как опция |
| OrderID только 8 цифр или внешний string | Telegram-ТЗ требует 8 цифр; Loading поддерживает string | Считать OrderID opaque string; source-specific validation |
| Размеры на item/place/обоих | Mobile ТЗ оставляет вопрос открытым | Операционные L/W/H хранить на CargoPlace; item-level — optional reference |
| Вес order или place, actual или declared | Telegram хранит total; BOL AS-IS берет полный order weight | Place-level actual/declared/unknown; totals только по включенным places |
| Может ли Close завершаться offline | Требуется offline, но нужны authoritative checks | Offline создает `Ready to close`; финальный Closed только server-confirmed |
| Кто подтверждает Loading/Unloading | AS-IS любой workflow user; ТЗ требует ответственного | Worker submits; supervisor confirms partial/issues/override |
| Роли бригадира и грузчика | Telegram-ТЗ не совпадает с целевым списком ролей | Crew lead и worker — permission profiles внутри warehouse/delivery scope |
| Сосуществование старых решений | Переходный master/write policy не определен | Wireframe не показывает dual write; до разработки нужен один owner факта на объект |

### P1 — решить до usability validation

| Вопрос/противоречие | Рекомендуемое направление |
|---|---|
| Минимум Pickup/Dropoff photos: 4, 2 или 4 | Configurable checklist по operation/cargo/issue; недостаток может быть warning или blocker по политике |
| POD: подпись, имя, PIN или фото | Утвердить юридически достаточный способ и fallback при отказе |
| Кто может сканировать: driver/crew/warehouse | Задать permissions по operation и location, не по названию роли |
| Extra place на Loading/Unloading | Создать discrepancy; включение в manifest только после supervisor decision |
| Repeat Pickup/return/reuse place | Не переиспользовать PlaceID; моделировать новую операцию и events |
| Undo ошибочного scan | Append correction/reversal event с reason, не удалять историю |
| Label reprint/replacement | Сохранять один PlaceID, историю codes/reprint и причину |
| Временная зона NY и операции CA | Хранить absolute time; в UI показывать local warehouse time с timezone label |
| Обязательные BOL реквизиты | Утвердить business profile; placeholder должен блокировать generation |
| Авто- или ручная генерация BOL | Авто-queue после confirmed Close + ручные Retry/Regenerate для уполномоченного пользователя |
| BOL lifecycle и подписанная версия | Утвердить переходы, owners, void/correction и retention |
| Discrepancy owners и SLA | Определить назначение, escalation и допустимые resolution outcomes |
| Нужен ли документ для Same Day кроме POD | В новом контексте не задано | Не добавлять BOL; уточнить только отдельные customer/route documents при бизнес-необходимости |

### P2 — можно уточнять после low-fidelity wireframe

- типы упаковки и справочники;
- единицы измерения и необходимость metric display;
- конкретные mobile/external scanners и принтеры;
- количество cached задач/дней offline;
- правила сжатия фото, retention, privacy и backup;
- необходимость геолокации;
- color/zone filters из Loading Control и их реальная бизнес-ценность;
- формат уведомлений dispatcher/supervisor;
- действия admin в мобильном приложении против отдельной desktop-консоли;
- download/share ограничения для BOL/POD.

## 14. Основание плана и границы доказательств

Изучены все доступные документы и контекстные папки в рабочем корне:

- `Техническое задание на реализацию Loading Bot TG.docx` — требования Telegram-сценариев Pickup/Delivery; actual bot code отсутствует, поэтому это TO-BE/спецификация, а не подтвержденная реализация;
- `ТЗ мобильного приложения.docx` — целевой epic и критерии;
- весь пакет `zaberman-mobile-app-audit`: шесть корневых Markdown-файлов;
- все четыре документа `zaberman-mobile-app-audit/actions`;
- все четыре файла `zaberman-mobile-app-audit/reference`, включая JSON examples.

Дополнительный бизнес-контекст этой редакции: филиалы `NJ1`, `CA1`, `CA2`; девять допустимых направлений; Local/Same Day как основной ежедневный контур; CA1 ↔ CA2 как отдельный interbranch transfer с неутвержденными Loading/Unloading/documents.

Фактически подтвержденными считаются только решения, помеченные в audit-пакете как реализованные в deployable Loading Control и BOL Generator. Production deployment, Telegram-бот, live Sheets/Drive, triggers и end-to-end Trip → PDF текущей сессией не подтверждены. Поэтому wireframe использует доказанные бизнес-правила, но не воспроизводит технические ограничения текущего Apps Script/Spreadsheet интерфейса.
