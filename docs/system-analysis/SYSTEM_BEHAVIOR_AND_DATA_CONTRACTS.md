# Системное поведение и внутренние контракты

**SA-0.1 · 2026-10-16 · Проект системной спецификации для команды.** Дополнение к [ТЗ v1.0](../DEVELOPMENT_HANDOFF.md). Не изменяет код, утверждённый UI, scope или статусы бизнес-решений. Это семантические контракты mobile/backend, а не объявленные существующими HTTP endpoints, SQL-таблицы или API Spoke.

Основание: [review SA-01–12](../current/SYSTEM_ANALYSIS_REVIEW.md), [согласованные BD/RQ](../requirements/RELEASE_1_DECISIONS.md), [ТЗ](../requirements/TECHNICAL_SPECIFICATION.md), [NFR](../requirements/NON_FUNCTIONAL_REQUIREMENTS.md). Подробный обмен, очередь и recovery — [Integration mapping & sync](INTEGRATION_MAPPING_AND_SYNC.md).

## Статусы положений

| Обозначение | Применение |
|---|---|
| B — Business confirmed | Правило прямо следует из BD/FR/принятых invariants. Источник указан в таблицах |
| T — Technical proposal | Предлагаемый общий контракт для реализации; названия полей/состояний, форматы и границы атомарности принимает команда при техническом review |
| D — Decision point | Конкретная нерешённая ветка. Вариант указан, но не утверждён вместо owner; уточняется при работе над этой веткой |

Все новые имена команд, состояний и DTO ниже — **T**. Они не новые FR, не permission менять бизнес-правила и не доказательство готового production API. Подтверждённые правила имеют приоритет над предложенными именами. RQ не останавливают независимые работы; доступы и внешние проверки выполняет команда по ходу разработки.

## Идентификаторы и связи

| Идентификатор | Смысл / владелец / создание | Инвариант и источник |
|---|---|---|
| `orderId` | Внутренний ключ ссылки на внешний Order; разрешает backend mapping (T) | Не display number и не номер строки. Не создавать master Order из ручного capture; FR-050, PD-014 |
| `sourceRef` | Пара source namespace + object type + external ID; связывает внешнюю и внутреннюю сущность (T) | Строковый opaque ID, без удаления букв/ведущих нулей. Vendor payload не утверждён; OQ-03 |
| `routeId` / `stopId` | Стабильные внутренние ключи проекции, внешние ссылки отдельно (T) | Stop не определяется одним Order: тот же Order может встречаться в разных контекстах, которые нельзя склеивать. FR-002/003 |
| `handoffId` | Ключ конкретной операции Pickup либо Delivery; создаётся один раз и сохраняется локально (T) | Не вычислять только из Order/date. Это не разрешение на произвольные повторные original Pickup: eligibility проверяется отдельно; FR-011/015/020 |
| `draftId` | Ключ editable draft операции; standard/supplemental контексты раздельны (T) | Повтор открытия/сохранения восстанавливает тот же draft; FR-011, NFR-006 |
| `groupId` / `placeId` | Группа измерений и отдельное фактически учитываемое место | UUIDv7 PlaceID — B по PD-009; остальные форматы — T. Новое место не получает ID удалённого; group Qty не меняет существующие IDs; FR-012/030 |
| `labelAlias` | Читаемый alias/legacy code места; не primary key | B: reprint сохраняет placeId, изменяемые размеры/имя не в payload; FR-030/032 |
| `ebolId` | Документный lifecycle одного Order (T) | B: один Order eBOL, Pickup/Delivery раздельны, POD — итоговое представление; FR-016/023 |
| `versionId` | Ключ snapshot конкретной передачи/original/supplemental версии (T) | B: locked version immutable, Supplemental содержит добавленный состав; FR-015/024 |
| `reviewId` | Ссылка на подготовленное review и его evidence revision (T) | Нельзя подписать иной Order/старый review; FR-002/014 |
| `confirmationId` | Конкретное подтверждение стороны в контексте handoff/review/version (T) | B: method, signer и время; комментарий меняется — подтверждение этой стороны сбрасывается; FR-017–019 |
| `assetId` / `pdfJobId` | Identity файла и задания генерации PDF (T) | Повтор upload/job не создаёт новый бизнес-состав, ready файл связан с точной версией; FR-025, NFR-007 |
| `vehicleId` / `cycleId` / `inspectionId` | Машина, текущая пара Pre/Post-trip, отдельный осмотр (T) | Назначает пользователь; новый cycle сохраняет прежнюю историю. Display label не identity; BD-11, FR-009/010 |
| `commandId` | Identity одной попытки применить логическое изменение, сохраняемая до отправки (T) | B: технический повтор не второй факт. В POC поле называется `operationId`; при reuse сделать явный mapping, не менять действующий POC контракт; NFR-003 |
| `userId` / `deviceId` | Проверенный пользователь и техническая корреляция устройства (T) | Полный доступ по BD-06 не делает client role/DEV_* identity; deviceId не credential; FR-048 |

Связи: Order → операции → drafts/reviews/версии; handoff → тип + Order + optional stop; eBOL → версии Pickup/Delivery и supplements; версия → immutable evidence + confirmations + assets/PDF. Nullable stop означает manual context, не новый внешний Order. Не вводить обязательный RouteRun/Trip для Local. Branch=Warehouse (BD-03); справочник один бизнес-объект, физические таблицы здесь не выбираются.

Для повторных визитов/задач к одному Order сначала проверить допустимый business context. Новый `handoffId` защищает от смешивания данных, но не утверждает новый workflow. Количество разрешённых original handoffs при повторном визите уточнить только при возникновении такого сценария, сохраняя правило Supplemental для нового груза после lock.

## Revision, время и источник

| Поле (T) | Правило |
|---|---|
| `localSequence` | Порядок локальных изменений draft; устойчив после restart, не серверная revision |
| `entityRevision` / `expectedRevision` | Выданная backend revision изменяемого объекта и ожидаемая база команды. Клиент не объявляет новую server revision самостоятельно |
| `sourceVersion` | Версия внешней проекции, если источник её предоставляет; иначе adapter использует технический fingerprint. Не называть его Spoke version без доказательства |
| `evidenceRevision` | Редакция грузового evidence, которую показали в review. Поздний ack старой revision не подтверждает новую |
| `effectiveCargoSetRevision` | Ссылка/ревизия эффективного signed Pickup и набора supplements, показанного на Delivery review; изменение состава требует нового review, а не незаметного добавления мест |
| `partyCommentRevision` | Комментарий конкретной стороны отдельно; изменение требует её повторного confirmation по FR-019. Изменение общего evidence между подписями — D/RQ-01 |
| `occurredAt` / `receivedAt` | Время действия на устройстве с offset и время приёма сервером. Сервер не доверяет часам устройства для прав/expiry и не подменяет occurrence временем retry |
| `workDate` / `sourceTimeZone` | Бизнес-дата маршрута и timezone источника. Не выводить дату рейса из текущего timezone iPhone; формат/источник определить в mapping |
| `contentDigest` | Проверка идентичности байтов/содержимого (T); алгоритм и canonicalization документирует команда. Hash клиента не заменяет авторизацию, подпись или серверную проверку |

Units/precision: reference in/lb/cu ft сохраняет бизнес-смысл. В контракте каждое измерение имеет единицу; пересчёт выполняется явно один раз. Объём известной группы Q×L×W×H/1728, known weight Q×weight/place; incomplete не добавляет фиктивный ноль. Точность хранения, конверсия источника и rounding представлений — техническое уточнение с owner при изменении результата, а не перенос старого UI округления в storage.

## Бизнес-данные на границе mobile/backend

Типы ниже семантические: `ID` opaque string, `Revision` opaque token, `Instant` timestamp с offset/UTC, `Decimal` число с согласованной точностью. JSON decimal encoding/лимиты выбирает команда. R — обязательно для данного действия; C — условно; O — необязательно. Не требовать весь DTO при partial draft save.

| Объект (T) | Поля и обязательность | Validation / бизнес-правило |
|---|---|---|
| OperationContext | R: handoffId, kind=pickup/delivery, orderId; C: stopId/routeId для assigned; O: sourceRef | Order разрешён через доверенный mapping/cache. Manual stop=null не создаёт внешнее назначение. FR-002/011/020/050 |
| Draft | R: draftId, context, localSequence; C: expectedRevision при server update; O: groups, photos, comments, packaging | Editable draft может быть неполным; серверный draft save не означает handoff completion. FR-011/014 |
| DimensionGroup / Place | R: IDs и связь с Order/draft; C: known Qty/размеры/вес и quality; O: packaging | Известная Qty — положительное целое, измерения >0; unknown nullable с причиной. Изменение Qty сохраняет IDs существующих мест; server создаёт не повторные места при replay |
| MissingDataExplanation | R: перечень отсутствующих сведений, reason, author reference; T: field paths/группы, occurredAt | Один комментарий может охватывать несколько полей, если ясно что и почему отсутствует. Не вводить обязательный комментарий на каждое поле. BD-09 |
| Photo/SignatureAsset | R при capture: assetId, local persistent reference, kind, owner context; C при upload: size/type/digest; C: server asset reference после finish | Metadata count не доказывает наличие файла. Фото отсутствует с BD-09 reason — это отсутствие, а не пустой fake asset. Сбой upload существующего файла не заменять reason «фото отсутствует» |
| EvidenceSnapshot | R: version/context, captured revision, состав учитываемых places, known totals/quality, missing explanations; C: photo references, condition/exception | Проверить собственный Order/места; signed versions не читают current projection вместо своего snapshot. Нельзя выдумать PlaceID для неизвестного физического места |
| Confirmation | R: side=contact/driver, method, signer identity/name, review/evidence binding, partyCommentRevision, occurredAt; C: signature asset или trusted OTP proof | Contact signature либо verified OTP; driver signature обязателен. Contact signature не переиспользуется из другого handoff/review; сохранённая employee signature только с явным подтверждением/действующей делегацией по NFR-011. Поле userId клиента не доказывает actor; контакт не становится app user. OTP value не сохраняется в документе |
| SignedVersion | R: versionId, ebolId, handoffId, immutable evidence, подтверждения, accepted revision; C: original/supplement link | Backend связывает обе стороны с согласованным evidence; PDF job отдельный. Freeze checkpoint D/RQ-01, correction D/RQ-02 |
| DocumentResult | R: versionId, generation state; C: assetId/file reference при ready; O: delivery attempt | Ready означает реально доступный PDF этой версии. Generated ≠ sent ≠ delivered; email опционален. FR-025/026 |
| Inspection | R при завершении: inspectionId, vehicleId/cycleId, type, checks, attestation, required photo refs; C: issue notes | Pre: 8 Pass, 5 ракурсов, attestation; Issue блокирует passed. Post Issue с описанием допустим, stops не закрывает. Cargo missing-comment не отменяет inspection gate |

### VAL — матрица missing/invalid

| Ситуация | Сохранение draft | Review / подтверждение | Источник / статус |
|---|---|---|---|
| Нет cargo фото | Да, явная неполнота | С комментарием менеджера что/почему; без него не продолжать | B: BD-09, FR-014/021/027 |
| Неизвестные размеры/вес | Да, nullable/quality | Причина охватывает отсутствующие поля; totals known-only | B: FR-013, PD-011, BD-09 |
| Отрицательное/нечисловое введённое измерение | Не объявлять его валидным измерением; прежнее сохранённое значение не уничтожать | Исправить значение либо явно отметить неизвестным с причиной; комментарий не делает invalid значение корректным | B: FR-013/014; representation T |
| Неизвестна Qty/идентичность всего состава | Сохранить доступные сведения без выдуманных мест | Не вводить новый hard Qty минимум в обход BD-09. Точное представление/подписание полностью неидентифицированного состава — D при этом кейсе; независимые операции продолжаются | BD-09 + достоверность context; уточнить owner при необходимости |
| Нет trusted Order context | Можно сохранить локальный unbound ввод как T, без создания master Order | Нельзя подписать документ чужого/вымышленного Order; policy привязки unknown Order — D | FR-002/020/050 |
| Нет contact/driver confirmation | Да | Missing-data comment не подменяет подтверждение | B: BD-08/09, FR-017/022 |
| Physical refusal/mismatch | Сохранить имеющуюся работу | Сообщить диспетчеру, открыть следующую точку, проблемная не completed | B: BD-05, FR-042 |
| Ошибка локального/серверного save | Только ранее подтверждённая запись считается сохранённой | Нет ложного success; retry/восстановление | B: NFR-001/007 |

## Независимые состояния

Это внутренние технические состояния T, не новые экранные статусы/UX. Их отображение использует существующий UI и явное различие local/server результатов. Один общий `completed` для всех строк недопустим.

| Контур | Состояния T | Кто определяет / граница |
|---|---|---|
| Operation work | draft → review → awaiting_confirmations → locally_finalized → server_accepted | Mobile определяет локальные результаты; server_accepted только доверенный backend outcome. Имеющийся document completed отдельно; точный operational close checkpoint D/RQ-01 |
| Document version | editable → review_prepared → partially_confirmed → locally_locked → server_locked | Имена T; точный freeze/редактирование после первого confirmation D/RQ-01. Locked snapshot не перезаписывается |
| Order eBOL projection | draft / pickup_locked / delivery_review / completed | B ядро FR-016/022/023; completed после Delivery lock, server/local authority явно различать. Это не готовность PDF |
| Sync entry | pending / waiting_dependency / in_flight / acknowledged / retry_wait / conflict / rejected / auth_required | Transport/revision состояние одной команды; не бизнес-результат маршрута |
| Asset | local_ready / uploading / uploaded_unverified / server_ready / retry_wait / failed | Local ready только после устойчивой записи; server_ready после подтверждённого finish/проверки bytes |
| PDF job | queued / running / ready / retry_wait / failed | Immutable input version; ошибка PDF не откатывает принятый handoff |
| Inspection cycle | pre_required / pre_in_progress / pre_issue / pre_passed / post_recorded | Успех Pre открывает import; новый cycle снова требует Pre. Issue recovery D/RQ-04 |
| Route projection | absent / cached / refreshed / update_conflict | Нет новой автоматической диспетчеризации; бизнес-исход отмены активного stop D/RQ-03 |

### ST — переходы состояний

| ID | Исходное → действие → результат | Guard / authority | Side effects и ошибочная ветка | Источник |
|---|---|---|---|---|
| ST-01 | pre_required → сохранить осмотр → pre_in_progress | Проверенная/допустимая cached identity; vehicle/cycle | Устойчивый draft; write failure не saved | FR-009, NFR-001 |
| ST-02 | pre_in_progress → завершить Pre → pre_passed либо pre_issue | Все checks Pass/ракурсы/attestation для passed | Issue не снимается reconnect; recovery RQ-04. Остальные функции не получают global gate | BD-11, FR-004/009 |
| ST-03 | pre_passed → import route → refreshed/cached | Успешный актуальный vehicle cycle; доверенный import outcome | Атомарно применить projection; ошибка не заменяет route пустым. Import технически online, cached reading отдельно | FR-004/050 |
| ST-04 | cached/Tasks → открыть stop → draft/review/locked view | Точный Order/stop и вид операции | Восстановить существующие IDs; открытие ничего не завершает | FR-002/003/011 |
| ST-05 | editable draft → save → сохранённая local revision + pending | Валидно сохранён доступный partial ввод | Persistent file refs + draft/outbox; local write failure не создаёт ready entry | FR-011/013, NFR-001 |
| ST-06 | saved draft → prepare review → review_prepared | Контекст достоверен; missing reason и validation; revision актуальна | Зафиксировать review binding; stale/invalid даёт ошибку без lock | FR-014/021 |
| ST-07 | review → contact confirmation → partially_confirmed | Signature asset либо trusted online OTP; имена/комментарий/binding | Evidence edit после этого D/RQ-01; изменение своего comment сбрасывает свою confirmation | FR-017–019 |
| ST-08 | partially_confirmed → driver confirmation → locally_locked | Обе стороны относятся к актуальному evidence; driver подписывает | Local immutable version + pending submission. Это не server_accepted и не ready PDF; RQ-01 для freeze checkpoint | FR-016/017/022 |
| ST-09 | locally_locked → submit → server_locked/server_accepted | Identity/revision/business invariants; captured asset dependencies server_ready | Атомарно применить accepted snapshot/fact/result и durable PDF job intent (T). Conflict не перезаписывает signed факт; PDF generation отдельно | NFR-003/007/019, BD-08/10 |
| ST-10 | pickup_locked → new cargo → supplemental draft | Новые place IDs/версия, исходный snapshot immutable | Новые confirmations только добавленного состава; unsigned additions не confirmed | FR-015/020 |
| ST-11 | Delivery draft → prepare/lock → completed eBOL projection | Locked Pickup + подтверждённые supplements, свой Order; effective cargo set совпадает с review, обе стороны подтверждены | Local completed отдельно от server result; POD view после lock, доступный PDF только после generation ready | FR-021–024 |
| ST-12 | queued PDF → generate/persist → ready либо retry_wait/failed | Input version immutable, подтверждения/файлы доступны | Прежний PDF не перезаписывать и грузовой факт не откатывать | BD-08/10, FR-025 |
| ST-13 | draft/problem → notify dispatcher и next stop → прежняя операция незавершена | BD-05; действие доступно без ложного success | Сохранить доступный draft; не вводить новый mandatory exception module или auto-completion | FR-042 |
| ST-14 | current cycle → Post-trip → post_recorded | Issues с описанием; acknowledgment unfinished stops | История сохраняется; stops не становятся completed; новый cycle требует Pre | FR-010 |
| ST-15 | active stop → внешний update/cancel → update_conflict | Есть локальная незавершённая работа/факт | Сохранить обе проекции, без молчаливого стирания; конечный исход D/RQ-03 | FR-050, NFR-004 |
| ST-16 | signed version → correction/void request → связанная новая запись по выбранной policy | Причина + ссылка на исходный; разрешённый процесс D/RQ-02 | Не unlock/overwrite original; не трактовать полный доступ как отсутствие document invariants | FR-043 |

Рекомендация RQ-01: freeze cargo evidence на первом подтверждении, final lock после водителя; изменение evidence требует новой review revision и повторных затронутых подтверждений. Это **D/Proposed**, не выбранное owner правило. Никакая строка ST не выбирает эту ветку автоматически. Комментарии каждой стороны сохраняют отдельное правило FR-019.

## Общий контракт команды и результата

Смысл команды T: `schemaVersion`, `commandId`, `commandType`, `targetType/targetId`, `expectedRevision`, `context`, `occurredAt`, `deviceId`, `payload`. `expectedRevision` обязательно при изменении существующего объекта; создание явно отличать от update, `null` не означает force overwrite. Новый объект создаётся с устойчивым заранее сохранённым ID и проверенными родительскими ссылками.

Actor определяется проверенной сессией backend, а не полем role/userId в payload. Captured author/время — evidence metadata, не полномочия. При offline действиях сохраняется идентичность первоначального автора; отправка другим вошедшим пользователем не меняет автора молча. Конкретная reauthentication/делегация — отдельная policy, не придуманная здесь функция.

Ответ T: `commandId`, `outcome`, `targetId`, `appliedRevision`, `serverReceivedAt`, `result` либо `error`. Outcome: `applied`, `replayed`, `conflict`, `rejected`, `pending_dependency`. Последний — команда ещё не применена; окончательное состояние узнаётся по commandId. Client local save — отдельный локальный ответ, не server outcome. Обёртка версии/API transport и HTTP codes определяются при техническом review.

### Идемпотентность и concurrency

1. Scope commandId — operational namespace Zaberman; identity сохраняется до отправки. При каждом запросе сначала проверять identity и право доступа к результату, включая replay.
2. Тот же commandId + тот же смысл payload/context/base revision → один первоначальный результат. Изменяемые transport token/номер retry не часть business payload fingerprint.
3. Тот же ID с другим payload/target/base revision → `IDEMPOTENCY_KEY_REUSE`; не replay и не второй факт. После фактического исправления команды — новый commandId и актуальная база.
4. Потерянный ответ → lookup результата либо повтор неизменённой команды с тем же ID; не создавать новый ID только из-за timeout.
5. Revision check и применение защищаются одной согласованной transaction/конкурентной границей. Два устройства с одной base revision: применяется допустимый первый результат, второй получает conflict; signed snapshot не merge/overwrite.
6. Та же принятая команда FinalizeHandoff → replay. Новая команда к уже locked версии → доменная ошибка `ALREADY_LOCKED` (или согласованный equivalent), а не повторный lock. Так согласуются FR-022-AC2 и NFR-003-AC1.
7. Срок хранения результатов и повтор после его истечения уточняет команда: уникальность доменного факта и проверка locked version должны исключать дубли и после очистки технического журнала. Истечение retry log не разрешает повторный физический handoff.

### QRY — чтение (T)

| ID / операция | Вход | Результат / отсутствие данных | Связь |
|---|---|---|---|
| QRY-01 SessionContext | Проверенная credential/session | userId, session validity, server time; нет branch restrictions Release 1; expired требует auth, не client role switch | FR-048, NFR-009/010 |
| QRY-02 RouteSnapshot | vehicle/cycle и business date, optional известная source revision | Подготовленная route projection + Order/stop refs, provenance/freshness. Import требует Pre; отсутствие/ошибка не подменяются route success | FR-003/004/050 |
| QRY-03 ResolveOrder | sourceRef либо введённый display reference + namespace контекста | resolved orderId + доступные details; not found или ambiguous отдельно. Запрет брать первый похожий Order | FR-002/005/020 |
| QRY-04 OperationAndVersion | orderId + handoff/stop или явный versionId | Свой draft/revision, effective signed Pickup/supplements, history и document result. Current и historical version раздельны | FR-015/020/024/025 |
| QRY-05 CommandResult | commandId | Applied result, ещё processing/pending либо unknown; unknown не доказывает, что команда не была применена | FR-046, NFR-003 |
| QRY-06 PlaceLookup | placeId либо распознанный alias + schema/version | Однозначное место и provenance/cached scope; unknown/unsupported отдельно; не меняет load/receive counts | FR-029/030/033 |

### CMD — изменения (T)

| ID / операция | Минимальный payload и prerequisites | Результат / повтор / атомарная граница | Связь |
|---|---|---|---|
| CMD-01 SaveInspection | inspectionId, vehicle/cycle, type, answers/media/attestation; mode=draft/complete | Draft/complete revision; completed Pre только валиден. Проверка cycle + запись результата согласованы; recovery Issue D/RQ-04 | ST-01/02/14; FR-009/010 |
| CMD-02 SaveHandoffDraft | context/draftId, base revision, groups/place IDs, measurements/quality, photo refs, missing reason | Server draft revision; повтор не создаёт новые places. Принятый partial draft не означает locked evidence. Для новых places согласовать mapping на POC CreateCargoPlace, не выдавать существующий endpoint за весь SaveDraft | ST-05; FR-011–014/021 |
| CMD-03 PrepareReview | handoffId, устойчивый client-created reviewId, exact draft/evidence revision, expectedRevision; для Delivery effectiveCargoSetRevision/точные Pickup/supplement refs | тот же reviewId + immutable review input reference; validations с BD-09. Конкурентный edit не считается тем же review | ST-06; FR-002/014/021 |
| CMD-04 RecordConfirmation | review/evidence binding, side, method, comment revision; подпись либо trusted proof | Confirmation именно этой стороны/редакции; не final handoff. Local capture/online receipt различаются; OTP подтверждает provider/backend, не клиентский success flag | ST-07/08; FR-017–019 |
| CMD-05 FinalizeHandoff | handoff/version/review IDs, base revision, effective evidence/confirmation refs, type=pickup/delivery, mode=original/supplemental; для Delivery expectedPickupSetRevision и reviewed version refs | Один accepted snapshot/fact/result + durable intent PDF job. Captured files/подписи server_ready; отсутствие cargo фото с reason допустимо. Pickup/Delivery prerequisites проверяются сервером, включая неизменность reviewed effective cargo set в той же границе проверки/применения. Новый lock locked версии не создаёт вторую запись | ST-09/10/11; FR-015–024; NFR-003/019 |
| CMD-06 EnsurePdf | accepted versionId и renderer/template version из согласованного контура | Вернуть ready существующего PDF либо один job/result для этой версии/формата; retry не читает current Order и не перезаписывает прежний готовый signed PDF. Точный template/numbering ещё открыты | ST-12; FR-025, BD-08/10 |
| CMD-07 RequestDocumentCopy | versionId, доступный канал, подтверждённый recipient, attempt identity | Отдельный request/delivery attempt; канал unavailable не success. Optional email не gate handoff; receipt/provider retry — интеграционный контракт | FR-025/026, INT-05 Conditional |
| CMD-08 RequestCorrection | исходный fact/version reference, reason, предложенное изменение | Только после выбора RQ-02: связанную запись/запрос, не перезапись original. Конкретное применение/повторные подписи — D, не реализовать произвольный void автоматически | ST-16; FR-043 |

Зависимость CMD-03/04 от сети не обязательна для local capture: клиент может сохранять локальные review/bindings/подтверждения и отправлять их позже по [матрице sync](INTEGRATION_MAPPING_AND_SYNC.md#sync--очередь-и-recovery). Server проверяет те же revisions/invariants. Какой offline signing допуск действителен при expiry сессии — D/NFR-010; online OTP не заменяется локальным маркером.

## ERR — ошибки и действия

Каждая ошибка T содержит `code`, `category`, безопасное `message`, `targetId`, optional `fieldPaths/currentRevision`, `correlationId` и допустимость retry. Не возвращать чужие secrets/OTP/raw stack; currentRevision возвращать только авторизованному пользователю. UI использует существующие действия/статусы, новая error console не требуется.

| Код T | Условие | Действие клиента / сохранность |
|---|---|---|
| AUTH_REQUIRED | Online session отсутствует/истекла/отозвана | Приостановить защищённую отправку; сохранить pending; reauth по policy, без замены автора |
| ORDER_NOT_FOUND / ORDER_AMBIGUOUS | Нет однозначного trusted Order mapping | Уточнить выбор/номер/источник; сохранить локальный ввод, не создавать Order автоматически |
| VALIDATION_FAILED | Invalid значение, missing reason, prerequisites | Показать поля/причину; исправленная business команда получает новый ID; сохранённое не терять |
| STALE_REVIEW / REVISION_CONFLICT | Review/base revision устарели | Сохранить local work, получить актуальный контекст и согласованный разбор. Не auto Keep local для signed фактов |
| IDEMPOTENCY_KEY_REUSE | Старый ID с иным смыслом | Не повторять автоматически; исправить создание команд/показать support correlation |
| ALREADY_LOCKED | Новое действие пытается повторно lock | Открыть принятую версию; не unlock/re-sign молча. Повтор исходного commandId вместо этого replay |
| PREREQUISITE_NOT_MET | Нет signed Pickup, unsigned supplement, Pre gate и т.п. | Показать конкретную зависимость; не обходить missing-comment исключением |
| ASSET_NOT_READY | Metadata есть, captured bytes ещё не подтверждены | Дождаться/retry upload; не fake ready и не удалять local file |
| LOCAL_WRITE_FAILED / STORAGE_FULL | Не записан файл/draft/outbox | Не показывать Saved; безопасная очистка synced copies либо retry. Unsynced не удалять |
| TRANSIENT / DEPENDENCY_UNAVAILABLE | Сеть/сервис временно недоступны | Та же неизменённая команда после восстановления; лимиты/backoff выбирает команда |
| OUTCOME_UNKNOWN | Timeout/crash после возможного server commit | QRY-05 или replay того же ID; не новый handoff/ID |
| PDF_FAILED / CHANNEL_UNAVAILABLE | Ошибка generation/отправки | Сохранить accepted fact/version; отдельно retry документа/канала, без ложного delivered |

## Рабочие срезы для mobile/backend

| Срез | Последовательность / контракт | Конечный результат | Альтернативы / вопросы / QA |
|---|---|---|---|
| SL-01 User → Pre-trip → route → Tasks | QRY-01 → vehicle/cycle context → CMD-01 → QRY-02 → локальная запись route → stop→Order/draft | Route соответствует business date/vehicle, Tasks открывает свой Order/stop; Pre не закрывает остальные функции | API failure сохраняет cache; новый cycle требует Pre; Issue recovery RQ-04. TC-01–04 |
| SL-02 Pickup → local save → restart → sync | QRY-03/04 → CMD-02 local equivalent + media save → persistent outbox → asset finish → server CMD-02 | Тот же draft/place IDs после restart, known totals и reasons; server acknowledgement отдельно | Missing фото/измерения — BD-09; invalid/low storage/late ack. TC-05–10, TC-13/14 |
| SL-03 Review → signatures → PDF | CMD-03 → contact CMD-04 → driver CMD-04 → local lock → dependencies → CMD-05 → CMD-06 | Accepted immutable version с обеими сторонами, реальный PDF отдельно ready; доступ независимо от signature/OTP | RQ-01 checkpoint, RQ-02 correction; OTP online; partial upload/PDF failure/replay. TC-11/12/15–19 |
| SL-04 Dropoff → evidence → POD | QRY-04 effective Pickup/supplements → Delivery CMD-02/03/04/05 → QRY-04 POD → CMD-06 | Delivery snapshot и completed eBOL без изменения Pickup; PDF/POD generation не фиктивный | Unsigned supplemental блокирует; отказ — dispatcher + next stop; route update RQ-03. TC-20–24 |
| SL-05 Full access / lifecycle | QRY-01 → all app data/actions → session expiry/logout/reconnect | Полный доступ зарегистрированному; immutable evidence и actor binding сохраняются | Offline session/смена user policy D; expiry не удаляет pending. TC-25/26 |

Подробные Given/When/Then, mapping и dependency matrix находятся во [втором документе](INTEGRATION_MAPPING_AND_SYNC.md#tc--проверки-для-qa). Срезы детализируют существующие FR/NFR, не расширяют первый релиз.
