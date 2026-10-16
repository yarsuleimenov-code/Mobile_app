# Integration mapping, синхронизация и QA

**SA-0.1 · 2026-10-16 · Проект технической детализации.** Продолжение [System behavior & data contracts](SYSTEM_BEHAVIOR_AND_DATA_CONTRACTS.md). Новые поля, error codes, sync states и технические последовательности — **T/Proposed** для review команды. Бизнес-основа B — [BD/FR/NFR](../requirements/RELEASE_1_DECISIONS.md); D/RQ остаются точечными вопросами при реализации. Доступы/API не запрашивались, тесты внешних систем не проводились.

## MAP — источники и mapping

Колонка «внешний атрибут» намеренно не содержит выдуманных JSON paths. Известно только, что маршрут поступает из Spoke API. Имена `SpokeRoute/SpokeTask` — [локальные fixture types](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/spokeDomain.ts), не официальный vendor schema. Team заполняет реальный mapping по мере разработки adapter; внутренние contracts можно разрабатывать независимо.

| ID / внутреннее поле T | Semantic source / writer | Внешний атрибут / что проверить командой | Missing/stale behavior / граница |
|---|---|---|---|
| MAP-01 routeId/sourceRef | Подготовленный маршрут Spoke; source plan read-only в Mobile | Stable route external ID; fixture `routeId` не доказывает формат | Не генерировать identity из названия/даты. Нет стабильной связи — mapping error, прежний cache сохраняется |
| MAP-02 stopId/sourceRef/sequence | Stops Spoke, порядок задаёт внешний dispatcher | Stop key, уникальность внутри route/между reload, sequence, update/delete | Одинаковый Order в двух stops не один stop. Повтор snapshot не дублирует; удаление активного stop — D/RQ-03 |
| MAP-03 orderId/external order reference | Внешний Order master PD-014; backend mapping resolver | Spoke связь stop→Order и namespace; fixture `externalId` не нормативен | String opaque ID; не удалять буквы/нули. Not found/ambiguous отдельно; никаких автоматически новых master Orders |
| MAP-04 operationKind | Тип задачи в подготовленном плане | Vendor pickup/dropoff vocabulary → два внутренних типа | Не выводить из адреса/Branch/sequence. Unknown type не превращать в pickup по умолчанию |
| MAP-05 address/scheduledTime/workDate/timezone | План маршрута Spoke | Полный адрес, структурированность, дата/offset/timezone; fixture display time недостаточен | Отсутствие отмечается; не подставлять другой stop. API failure ≠ пустой маршрут. Недоступная критичная ссылка на Order/type не становится валидной из cargo comment |
| MAP-06 route vehicle/source revision | План Spoke; vehicle selection/inspection в app | Доступен ли immutable vehicle key/vehicle mapping, source version/sync watermark | Не связывать по похожему label. Согласовать конфликт выбранной машины/плана при реализации; Issue recovery RQ-04 |
| MAP-07 names/contacts/Requirements | Владелец внешних Order fields ещё не подтверждён; разрешённые рабочие поля — Zaberman | По каждому полю источник, возможность чтения/изменения, fallback | Не объявлять Spoke master всех полей. Не стирать рабочие значения source refresh и не менять ранее signed snapshot |
| MAP-08 movement_type/Branch | Order-owned classification PD-012; один Branch/Warehouse BD-03 | Источник enum, source codes, mapping к local_standard/local_same_day; справочник | Не вычислять Same Day по одинаковым Branch. Interstate lanes остаются поздними; неизвестная классификация явно unresolved |
| MAP-09 operational evidence | Заберман: handoff/place/measurement/condition/missing comment | Внешняя запись не утверждена; внутренние keys/revisions см. contracts | Source plan не перезаписывает измеренные факты. Задание не включает автоматическую обратную запись в Spoke |
| MAP-10 signatures/version/PDF | Document/operational boundary Zaberman | Version+actor+asset bindings; template/numbering и legal wording уточнить при document реализации | Immutable version; готовый PDF не current Order render; email optional и отдельно от generation |
| MAP-11 identity/session | Выбранная командой проверка пользователя | Provider/claims/revocation/onboarding; corporate identity конкретно не выбрана | Full app access для зарегистрированного, без новой branch RBAC; cached offline session policy D/NFR-010 |
| MAP-12 channel delivery | Отдельный модуль Twilio после подключения | Challenge recipient/proof, provider message ID/receipt, callback auth/order/retry | Клиентский OTP flag не verification; старый callback не подтверждает новую попытку. Calls позднее BD-13 |

Для всех source updates: хранить provenance и последнее успешно принятое состояние; не объявлять свежим старый cache после timeout. Способ получения изменений (полный fetch, delta, poll, webhook) команда выбирает по фактическому контракту; наличие любого из них не предполагается.

### Обработка route snapshots (T)

1. Проверить session и import Pre-trip guard. Источник — внешний план; выбор/назначение точек не создаётся Mobile App.
2. Получить внешний ответ, нормализовать типы/keys, проверить дубли и ссылки. Предлагаемый простой вариант: применять snapshot как целое; malformed критичные связи оставляют прошлую проекцию. Политику частичного import уточнить, если источник/объём её требует.
3. Сопоставить route/stop/Order по sourceRef, не по display strings. Обновлять только поля владельца плана; operational drafts/evidence остаются отдельно.
4. Записать новую проекцию и source metadata устойчиво; только после этого сообщать import success. Если source revision отсутствует, использовать локальную последовательность/fingerprint без обещания внешней монотонности.
5. При параллельных refresh ответ применяется только к тому vehicle/date/import context, для которого запрошен. Старая response не заменяет более новую принятую projection. Если источник не даёт ordering/version, не утверждать, что timestamp получения доказывает новизну плана; adapter фиксирует это ограничение.
6. Stop с активной локальной работой либо принятым фактом и изменившимся/cancelled назначением → явный conflict context. Не удалять draft/файлы; конечный business outcome RQ-03. Отмена плановой точки не отменяет уже принятую передачу.
7. После error доступен ранее сохранённый контекст с корректной freshness. Успешный реально пустой план различать с ошибкой/неполным ответом; оба не стирают operational history.

Manual: QRY-03 разрешает существующий Order по namespace/reference. Сетевой поиск не обязателен при достоверном cached mapping. Unknown/ambiguous не разрешает выбор первого совпадения. Локальный unbound ввод — T сохранение работы, без master Order/подписи/автоматического назначения. Если нужен handoff без однозначного Order, уточнить business outcome при таком кейсе; не считать это утверждённым обходом FR-002.

## SYNC — очередь и recovery

### Запись до отправки (T)

Локальный результат Save считается успешным, только когда данные/ссылки на уже записанные файлы и запись о необходимости синхронизации могут быть восстановлены. Filesystem + local database не объявляются одной доступной transaction: команда реализует staging/commit/reconciliation protocol. После crash не должно быть visible saved draft со ссылкой на несохранённый captured файл.

Порядок: записать file bytes устойчиво → зафиксировать metadata/draft и queue intent согласованно → показать local saved. Падение между первым и вторым шагом даёт recoverable staging/orphan, а не ready evidence; очистка только по безопасной policy, без удаления единственной нужной unsynced копии. При невозможности сохранить — прежняя версия остаётся, UI не сообщает Saved.

Очередь сохраняет T: queueEntryId, commandId, author/context, target, localSequence/evidence binding, dependency refs, base revision/dependency result, frozen payload+fingerprint после первого send, state, attempts/error и ack result. Секреты/OTP values в queue payload не хранить как evidence. Session credential не часть business fingerprint и не доказательство автора захвата.

### Порядок зависимостей (T)

| Элемент | Что должно быть готово | Что разрешено раньше | При неготовности |
|---|---|---|---|
| Inspection sync | Достоверный vehicle/cycle, сохранённые checks и требуемые captured assets | Локальный inspection draft/pass в допустимой session policy | Import требует подтверждённой согласованной guard проверки; offline draft не отменяет сам Pre |
| Route import | Доступный источник, session, успешный актуальный Pre | Cached reading и остальные функции не получают новый gate | Import error/cache retained; не fake refreshed |
| SaveHandoffDraft | Trusted Order mapping для server apply, IDs, partial validation | Local partial/unbound ввод, capture files | Waiting mapping/session; не создать master Order |
| Captured asset upload | Устойчивый local file/metadata, identity; если server requires owner — его draft/контекст | Отправка metadata partial draft со статусом pending assets | Draft accepted не означает server_ready фото; не формировать циклическую зависимость draft↔file |
| PrepareReview / RecordConfirmation | Exact evidence binding; domain prerequisites; доказанная session/OTP по методу | Local review/signature capture с устойчивыми IDs/bindings при допустимой offline policy | Server не заменяет присланный evidence последним current draft; конфликт требует разбора |
| FinalizeHandoff | Нужные draft/review/confirmation записи и referenced captured assets server_ready; для Delivery locked Pickup, effective supplements и совпадающая reviewed cargo set revision | Local lock/pending physical fact; capture следующего независимого draft | Waiting dependencies/conflict; нет server_accepted до guard успеха |
| PDF job | Accepted immutable version, подписи и referenced files, согласованный template context | Cargo fact уже может быть server_accepted | PDF pending/retry отдельно; не rollback принятого факта |
| Email/document copy | Подключённый канал, выбранная версия/получатель и готовый PDF | Optional request можно сохранить pending | Не delivered до trusted receipt; email не prerequisite handoff |

При отсутствии cargo фото по BD-09 зависимость на несуществующий файл не создаётся: snapshot содержит reason. Если фото действительно captured, технический upload failure не переименовывается в бизнес-отсутствие фото ради прохождения guard.

Зависимость на предыдущую server revision разрешается **до первого send** следующей команды. После первой отправки payload/context/base revision замораживаются: нельзя молча поменять expectedRevision, сохранив commandId. При обоснованном изменении смысла создать новую команду, сохранить связь с прежним локальным действием; unknown старого outcome сначала выяснить.

Клиент создаёт reviewId устойчиво до offline подтверждений; server PrepareReview принимает этот ID при валидном binding и возвращает его же, либо conflict. Нельзя молча перепривязать уже захваченную подпись к новому server-generated review/evidence. Технические increments entityRevision из-за регистрации confirmation не означают изменение cargo evidenceRevision.

### Переходы sync entry (T)

| Состояние / событие | Следующее состояние | Действие и invariant |
|---|---|---|
| pending + нет зависимости | waiting_dependency | Не отправлять заведомо неполную финализацию, сохранить dependency reason |
| pending/dependency ready + session ready | in_flight | Устойчиво сохранить frozen command до network call |
| in_flight + applied/replayed | acknowledged | Сохранить результат/revision, затем разрешить dependencies; ack только его localSequence |
| in_flight + timeout/process kill | retry_wait / outcome_unknown | Результат мог быть применён; QRY-05 или неизменённый replay, не новый ID |
| retry_wait + доступен сервис | in_flight | Та же команда; backoff/limits — технические параметры без выдуманных чисел |
| in_flight + transient/dependency unavailable | retry_wait | Не терять payload/file references; пользователь видит pending, не success |
| in_flight + auth failure | auth_required | Остановить защищённую отправку, не удалять queue; reauth по policy |
| in_flight + stale/revision/assignment conflict | conflict | Сохранить local/server contexts; не unconditional Keep local/авто overwrite |
| in_flight + invalid/ключ reuse | rejected | Нет endless automatic retry. Исправленный payload — новая команда после выяснения старого исхода |
| old revision ack + более новый local edit | acknowledged старой записи; новая остаётся pending | Не ставить всему draft synced по старому ack; учесть applied server revision при следующем send |

Разные handoffs можно синхронизировать независимо, пока нет общей domain dependency. Изменения одного объекта сериализовать по revisions. Unsigned draft edits до первого send можно объединять технически только без потери сохранённых данных, review/confirmation binding или аудита; frozen/in-flight команды не переписывать. Signed snapshots никогда не объединять как обычный draft.

### Конфликты и изменение доступа (T/D)

| Случай | Техническая основа T | Где нужен business ответ D |
|---|---|---|
| Два unsigned edits одной базы | Сохранить обе работы, отвергнуть stale apply, показать сравнимый контекст | Правило semantic merge полей, если потребуется; не навязывать новый merge UI заранее |
| Signed version + новый edit | Не менять исходный snapshot/PDF; новая связанная запись по процессу | RQ-01/02: checkpoints/исправления/повторные подписи |
| Отменённый/переназначенный stop с работой | Не стереть факт/draft; сохранить новый plan и конфликт | RQ-03: допустимое продолжение и ответственный за reconciliation |
| Vehicle Issue/замена | История issue/cycle сохраняется, reconnect не выдаёт pass | RQ-04: повторный Pre/новый cycle/разрешённый override |
| Session expired/offline | Запись pending сохраняется; online apply требует допустимой identity | NFR-010: offline допуск/TTL/reauth; не назначать числа |
| User сменился на устройстве | Новый credential не переписывает captured author; queue не теряется | Правило восстановления отправки от имени прежнего автора/делегация; не считать full access разрешением на impersonation |

## FILE — media и PDF

| Шаг / контракт T | Что фиксируется | Прерывание и восстановление |
|---|---|---|
| FILE-01 Local capture | AssetId, устойчивые bytes, type/size/digest, owner/revision и queue reference | Не объявлять capture сохранённым до durable save; прежнее evidence не терять |
| FILE-02 Begin/resume upload | AssetId, declared metadata, server upload reference; identity проверена | Повтор возвращает существующий upload/status либо объяснимый restart; chunk/resume protocol команда выбирает |
| FILE-03 Finish upload | Server проверяет фактические bytes/size/type/integrity; выдаёт server_ready ref | Partial bytes/одни metadata не server_ready; idempotent finish. MIME из client не единственная проверка |
| FILE-04 Bind accepted version | Version manifest с evidence/confirmation/asset refs и missing reasons | До accept проверить references/доступность нужных captured assets. После accept signed membership immutable |
| FILE-05 Generate PDF | Accepted version + template revision → PDF job + immutable output ref | Durable job intent вместе с accepted record (outbox/equivalent T), retry после crash. Не рендерить из current Order |
| FILE-06 Read/download/copy | Exact versionId→ready PDF; authorisation; delivery attempt отдельно | Expired transport URL/ref можно обновить, но не содержание signed версии. Unavailable не downloaded |
| FILE-07 Cleanup/restore | Связи versions/assets/queue, server ack и retention policy | Unsynced sole copy не удалять. Staging/orphans чистить лишь доказав отсутствие нужных ссылок; центральное auto-delete до policy не вводить |

Atomic domain boundary T: accepted handoff/snapshot/confirmation references + command result + durable PDF generation intent согласованно фиксируются внутри backend. Binary store и БД не считаются общей distributed transaction: file readiness проверяется до accept; ошибки после commit чинятся job recovery, не откатом принятого cargo fact.

Готовый signed PDF не переписывается новой генерацией из изменённого шаблона. Повтор возвращает ранее принятый результат; новая legal representation/template change требует явной policy версий, а не скрытой замены. Нумерация/формулировки/ретеншн не придуманы; owner подключается при соответствующем документном решении. Наличие подписи в локальном marker не считается сохранённым реальным signature asset.

## TC — проверки для QA

Это **28 проектных Given/When/Then cases**, а не пройденные тесты и не дополнительные FR. Ссылки указывают существующие requirements/AC; T/D предпосылки наследуют статус системной детализации. Численные лимиты не назначаются. При RQ QA проверяет согласованный после ответа вариант, не объявляет предложенный вариант утверждённым.

| ID / связь | Given | When | Then / ожидаемое доказательство |
|---|---|---|---|
| TC-01 / FR-004-AC1, BD-11 | Pre текущего cycle не passed | Пользователь запрашивает новый route import | Import не проходит; Tasks/manual и прочие доступные функции не получают нового глобального gate |
| TC-02 / FR-009-AC1/2, FR-010-AC2 | Все 8 Pass, 5 ракурсов, attestation; затем новый cycle | Завершить Pre; после Post начать новый cycle | Первый cycle passed/import допустим, новый снова требует Pre. Один Issue не passed; recovery ветка RQ-04 отдельно |
| TC-03 / FR-004, FR-050-AC2 | Есть cached route и активный draft | Получить timeout/malformed import либо повтор того же snapshot | Старый cache/draft не стираются; повтор snapshot не создаёт новые stops. Успешный пустой route отличим от failure |
| TC-04 / FR-002-AC1, FR-020-AC1/2 | Два stops содержат один Order reference; manual поиск ambiguous | Открыть выбранный stop, затем manual lookup | Контекст выбранного stop сохраняется; ambiguous не выбирает первый Order и не создаёт новый master |
| TC-05 / FR-014-AC1, FR-021-AC1 | Ноль cargo фото | Сохранить reason менеджера «какие фото отсутствуют и почему» и продолжить; повторить без reason | С reason review возможен, без него блокировка; нет fake photo asset и hard photo minimum |
| TC-06 / FR-013-AC1/2 | Q=3, 24×24×36 in, 18 lb/place; затем L unknown с причиной | Рассчитать и сохранить | 36 cu ft и 54 lb в известном случае; unknown volume исключён из known total, не 0 measured. Invalid отрицательное число не принимается как measurement |
| TC-07 / FR-012-AC1/2, NFR-006-AC1 | Три place IDs сохранены | Удалить одно место, добавить новое и restart | Сохранившиеся IDs прежние, новое не ID удалённого; нет дублирования draft/places |
| TC-08 / NFR-001-AC2, NFR-007-AC1 | Draft и файл ещё не durable либо storage full | Save/capture прерывается до commit | Нет ложного Saved; прежние данные доступны. Recovery различает staging file и принятый evidence reference |
| TC-09 / FR-046-AC1/2 | Изменения localSequence 10 и затем 11 | Сервер поздно подтверждает 10 | Ack относится только к 10; 11 остаётся pending. Следующая команда использует корректную server base до первого send |
| TC-10 / NFR-003-AC1/2 | Команда SaveDraft уже применена, ответ потерян | Повторить тот же ID/payload; затем тот же ID с другим payload | Первый replay возвращает прежний результат без новых мест; второй key reuse conflict, не новый success |
| TC-11 / FR-017-AC1, FR-022 | Контакт подтвердил, водитель ещё нет | Попытаться finalize | Lock не проходит; сохранённый contact confirmation не подменяет driver signature |
| TC-12 / FR-019-AC1/2 | Подпись водителя связана с его comment revision | Изменить его комментарий | Его confirmation требует обновления; старая signed историческая версия не меняется. Cargo evidence edit — отдельный RQ-01 вариант |
| TC-13 / NFR-004-AC1/2 | Два устройства имеют base revision R | Оба изменяют один draft | Первый допустимый apply меняет server revision, второй conflict; локальная работа второго не потеряна и signed snapshot не overwrite |
| TC-14 / NFR-007-AC2, FILE-03 | Metadata фото есть, bytes загружены частично | Finish upload / запрос finalize | Файл не server_ready, finalize ждёт dependency; нет PDF с ложным признаком сохранённого captured photo; retry сохраняет asset identity |
| TC-15 / FR-022-AC2, NFR-003-AC1 | Finalize уже accepted, ответ неизвестен | Replay исходного ID; затем новая команда lock той же версии | Replay прежнего результата; новая команда доменно отклонена без второй версии/подписи |
| TC-16 / FR-025-AC1/2, FILE-05 | Accepted snapshot записан, PDF ещё не создан | Worker/process падает; job запускается снова | Accepted fact сохраняется; durable intent восстанавливает job; ready PDF строго той версии, error не delivered |
| TC-17 / FR-024-AC1, FR-025-AC1 | Signed original существует, current Order/имя изменены | Открыть/повторно запросить PDF original | Старые имя/места/подтверждения в signed версии; не render актуальной проекции и не заменить старый output |
| TC-18 / FR-018-AC1/2, NFR-011 | OTP branch, provider недоступен либо proof невалиден | Клиент сообщает «verified»/вводит корректно выглядящий код | Backend не принимает client flag как proof; offline не successful verification; сырой OTP не попадает в PDF/queue evidence/log. Device signature — существующая альтернатива |
| TC-19 / FR-015-AC1/2, FR-024-AC2 | Original locked, появляются новые места | Сохранить Supplemental draft, затем подтвердить его | Original не меняется; новый состав имеет новые IDs/confirmations, unsigned supplement не показывается как signed |
| TC-20 / FR-020/021/022 | Pickup не locked, есть unsigned additions либо effective signed состав изменился после review | Подготовить/подтвердить Delivery | Draft можно сохранить; final confirmation требует правильных prerequisites; additions не confirmed. Нужный Pickup review доступен по принятому flow; изменение reviewed cargo set требует нового review, не незаметного добавления мест в подписываемую версию |
| TC-21 / FR-022-AC1/2, FR-023-AC1/2 | Pickup и effective supplements confirmed | Подписать Delivery | eBOL completed/POD view после Delivery lock; Pickup snapshot не изменён. Local completion отдельно от server ack и PDF ready |
| TC-22 / FR-042-AC1/2 | Физический отказ/несовпадение на точке | Сообщить диспетчеру и открыть следующую | Проблемная не completed/matches=true; введённая работа сохранена. Комментарий о missing данных не делает отказ успешной передачей |
| TC-23 / RQ-03, NFR-004 | Есть active draft/локальный физический факт; поступила отмена/переназначение | Применить route update | Обе стороны конфликта сохранены; факт не стёрт/не переписан планом. Дальнейший outcome проверяется по ответу RQ-03 |
| TC-24 / FR-041-AC1/2 | Назначенные Pickup и Dropoff Same Day | Завершить Pickup | Dropoff автоматически не completed; открывается отдельно из Tasks. Нет app-generated dispatch pair/обязательного Interstate Trip |
| TC-25 / FR-048-AC1/2, NFR-009 | Два зарегистрированных пользователя и неподтверждённый online actor | Читать данные/выполнить действие | Registered имеют весь app scope без branch deny; anonymous/DEV role не trusted identity; full rights не снимают signed invariants |
| TC-26 / NFR-008-AC2, NFR-010-AC1/2 | Pending evidence, expired session или смена user, мало места | Logout/reauth/cache cleanup/restart | Pending и sole local files не удалены; автор не заменён новым user; online requests ждут допустимую auth policy. Offline expiry исход — D, без придуманного TTL |
| TC-27 / FR-013, FR-050, SA-10 | Устройство и источник имеют разные timezone; workDate/units явно заданы | Импортировать route и измерения, затем создать документ | Бизнес-дата не сдвигается по timezone устройства; единицы преобразованы явно, known totals согласованы в app/PDF. Неизвестный timezone/unit не угадывается; точные precision/rounding согласует команда |
| TC-28 / FR-002/004/050, MAP-06 | Два refresh для разных vehicle/date или ответы пришли в обратном порядке | Поздний старый ответ поступает после нового | Он не заменяет актуальный выбранный context; active draft не теряет Order/stop. Без external version adapter не объявляет произвольный timestamp версией источника |

## Traceability и порядок использования

| Review finding | Где детализирован | Срез / QA |
|---|---|---|
| SA-01 | Словарь IDs/связей, context, MAP-01–03 | SL-01/02; TC-04/07 |
| SA-02 | Независимые состояния, ST-01–16 | SL-01–04; TC-01/02/11/19–22 |
| SA-03 | Идемпотентность, общий ответ, CMD-05, sync transitions | SL-02/03; TC-10/15 |
| SA-04 | MAP-01–09, route snapshot handling | SL-01/04; TC-03/23 |
| SA-05 | QRY-03, manual/unbound handling, VAL | SL-01/02; TC-04 |
| SA-06 | SYNC dependency/revision/recovery matrix | SL-02–04; TC-08–10/13/14/23 |
| SA-07 | FILE-01–07, CMD-05/06 | SL-03/04; TC-14/16/17/26 |
| SA-08 | DTO/missing explanation и VAL | SL-02/04; TC-05/06/20/22 |
| SA-09 | Actor/session binding, MAP-11, auth conflict matrix | SL-05; TC-25/26 |
| SA-10 | Revision/время/units dictionary, MAP-05/06 | SL-01–04; TC-06/27/28, source-specific пример выбирает команда |
| SA-11 | TC-01–28 и явное различие проектного case и выполненного теста | Все срезы; actual QA mapping команда добавляет к RTM |
| SA-12 | QRY/CMD/ERR contracts, MAP-10/12, FILE | SL-03/04; TC-16/18, реальные каналы по Conditional scope |

Существующая RTM/70 требований и их статусы не меняются от добавления этих таблиц. В backlog команды указывать SL/ST/CMD/TC рядом с исходным FR/AC. Technical proposal подтверждает команда при review, business D — owner в момент затронутой реализации. Этот пакет не заявляет завершёнными тесты/доступы/интеграции и не вводит необоснованных SLA/retention/OS цифр.
