# Анализ готовности требований

> **Актуализация 2026-10-16 после согласования.** Согласованная основа Release 1 внесена в требования. Первоначальные 24 gaps ниже — evidence аудита, их текущий disposition указан далее; наличие исходной строки не означает прежнюю блокировку. Core architecture может разрабатываться. Финальная приёмка ТЗ/релиза зависит от RQ и контрактных/эксплуатационных gates.

Draft 1.0, 2026-10-16. Цель: подготовить требования для аналитика, Product, разработки и QA. Основание — утверждённый прототип и [baseline](../PROJECT_BASELINE.md), [решения](../decisions/DECISION_LOG.md), [аудит](https://github.com/yarsuleimenov-code/Mobile_app/blob/main/docs/current/REPOSITORY_AUDIT.md), [инвентарь](https://github.com/yarsuleimenov-code/Mobile_app/blob/main/docs/current/REPOSITORY_INVENTORY.md), [handoff](../current/DOCUMENTATION_HANDOFF.md), повторное чтение active router/domain/screens/stores и текущего OpenAPI POC.

## Первоначальный вывод о готовности (до ответов BD)

Полный проект ТЗ подготовлен, но **не является финальным или согласованным production ТЗ**. Подтверждённые пользовательские действия и invariants можно описать; production scope, внешние masters, permissions, offline/conflict, юридические и hardware критерии остаются зависимостями согласования. Наличие source или unit test не доказывает готовность production-сервиса.

Приоритет: подтверждённые решения и утверждённый прототип → baseline → фактический source/контракт → исторический контекст. При конфликте первых источников не выбран победитель: GAP-08/09/19/20 зарегистрированы для согласования. Все 15 OQ разобраны в [review](OPEN_QUESTIONS_REVIEW.md).

## Текущий disposition 24 gaps

| Gap | Статус после согласования / остаток |
|---|---|
| GAP-01 | Бизнес-основа ядра определена BD-01/03; conditional channels/hardware отделены |
| GAP-02 | Spoke источник выбран BD-04; IDs/refresh/cancel и RQ-03 открыты |
| GAP-03 | Order ownership сохранён; field/movement mapping INT-01 открыт |
| GAP-04 | Branch=Warehouse BD-03; Interstate lanes отложены |
| GAP-05 | Внутренняя Same Day orchestration исключена BD-01/02; отдельные назначенные handoffs, FR-041 |
| GAP-06 | Notify dispatcher + skip утверждены BD-05; недоступные сведения BD-09; correction/active task RQ-02/03 |
| GAP-07 | Hard photo minimum снят BD-09; реальные файлы обязательны BD-10, formats/limits/retention INT-03 открыты |
| GAP-08 | Подписи/PDF BD-08 согласованы; freeze checkpoint RQ-01 не выбран |
| GAP-09 | Cargo completion, document lock и server confirmation раздельны; точный production checkpoint RQ-01 открыт |
| GAP-10 | Реальный OTP остаётся INT-05 conditional; fixture verification не используется, контракт сервиса открыт |
| GAP-11 | Полный доступ зарегистрированным BD-06; production identity/session/revocation INT-02 открыты |
| GAP-12 | Offline basis и retry без дублей BD-07 приняты; durable sync/multi-device/recovery acceptance впереди |
| GAP-13 | iPhone/iPad выбраны; roll printer модель/SDK/закупка позднее BD-12 |
| GAP-14 | Outbound manifest/recovery/numbering — отложенный Interstate |
| GAP-15 | Incoming/discrepancy/Delivery assignment — отложенный Interstate |
| GAP-16 | PDF target обязателен; communications условны, calls отложены BD-13 |
| GAP-17 | Assignment пользователем, проблемы вне app BD-11; recovery RQ-04 |
| GAP-18 | Logical architecture draft готов; stack/runtime SQL/NFR параметры не подтверждены |
| GAP-19 | Gate только route import BD-11; глобальный gate не вводится |
| GAP-20 | Interstate eligibility/Trip checkpoint отложены, не prerequisite Local |
| GAP-21 | BD-10: PDF доступен независимо от signature/OTP; email optional; INT-05 ещё нужен |
| GAP-22 | Общий barcode обмен отложен BD-14 |
| GAP-23 | Ignored первоисточники ещё требуют доступного handoff OQ-14 |
| GAP-24 | Pilot параметры отложены BD-15, gates до pilot admission |

## Новые зарегистрированные расхождения target и reference

| ID | Расхождение | Обработка в документации |
|---|---|---|
| SYNC-01 | Prototype hard photo minimum vs BD-09 | FR-014/021 AC updated; source не изменён |
| SYNC-02 | Локальные Dispatcher/Supervisor gates vs полный доступ BD-06 | FR-006/048 и NFR-009 target обновлены; identity ещё TBD |
| SYNC-03 | Неизвестный route vendor vs Spoke BD-04 | FR-004/050 и INT-01; master всего Order не приписан Spoke |
| SYNC-04 | Same Day orchestration кандидат vs dispatch outside BD-01/02 | FR-041 как подтверждённая граница, не новый app flow |
| SYNC-05 | Signature-only email checkbox vs PDF regardless method BD-10 | FR-025/026 обновлены; PDF availability и email не отождествляются |
| SYNC-06 | Branch/Warehouse split гипотеза vs один объект BD-03 | Business data target уточнён; физическая схема не меняется |

## Зарегистрированные пробелы — первоначальный evidence

«Закрытие» ниже означает требуемый артефакт решения/проверки, а не уже выполненную работу. Это не backlog разработки.

| Gap / приоритет | Прототип и документация: evidence | Недостающее production требование / влияние | Связь | Что требуется для закрытия |
|---|---|---|---|---|
| GAP-01 / Critical | [Baseline](../PROJECT_BASELINE.md): UI принят, MVP production не определён | Нельзя приравнять все TO-BE пожелания к обязательному release scope; оценки/acceptance нестабильны | OQ-01, FR-041/050 | Подписанная module/scope matrix с отложенными пунктами |
| GAP-02 / Critical | `spokeDomain.ts`, `cargoStore.tsx`: fixture route; master/vendor неизвестны | Refresh/assign/reassign/cancel, source IDs, устаревшие задачи, конфликт update vs in-progress не заданы | OQ-03, FR-003/004/050 | Ownership/assignment matrix и сценарии обновления |
| GAP-03 / High | `domain.ts` enum, Stage 0 PD-012; `CargoRecord` без канонического movement_type | Не задан полный field mapping; branch pair не определяет service type; риск неверного routing | OQ-02/03, FR-040/049/050 | Order-owned классификация и согласованный mapping |
| GAP-04 / High | Selector шести складов; историческая lane matrix NJ1↔CA1/CA2 | Нет production списка разрешённых lanes/interbranch документов и различия Branch/Warehouse | OQ-02, FR-035/049 | Таблица lane/type/operation/document/scope |
| GAP-05 / High | Нет active SameDay route; RouteRun концепция подтверждена | Pair creation, assignment, cancellation, partial completion и общий итог не определены | OQ-01, FR-041 | Lifecycle/связи двух задач без добавления Trip/BOL автоматически |
| GAP-06 / Critical | Dropoff имеет matches/damage; нет полного refused/partial/wrong/extra flow | Неясные исходы могут вести к потере груза/ложному завершению | OQ-04, FR-021/042 | Outcome/evidence/permission/escalation matrix |
| GAP-07 / High | `photoEvidenceDomain`: общий asset/metadata; UI минимум одно фото, старое ТЗ — иные minima | Нет реальных capture/file/upload rules, минимальной photo matrix и retention; нельзя принять поле по счётчику | OQ-05, FR-027/028, NFR-007/008 | Evidence matrix и file lifecycle/limits |
| GAP-08 / Critical | Stage 0 §3/4: freeze после первой подписи; `PickupSignatureScreen`/`orderEbolDomain`: final lock после водителя | Между первым подтверждением и driver lock не формализован revision/freeze contract | OQ-08, FR-016/017/019 | Согласованный checkpoint и invalidation всех зависимых confirmations |
| GAP-09 / High | `DropoffVerifyScreen`: может completeDropoff до pickup lock; `prepareDeliveryEbol` требует lock | Нельзя автоматически назвать локальный dropoff_complete completed eBOL/серверной выдачей | OQ-04/08, FR-021/022 | Раздельные completion states и подтверждённый production checkpoint |
| GAP-10 / Critical | `deliveryOtpDomain`: любой корректный шестизначный код кроме 111111 может success; outcome управляемый | Не production verification; expiry, recipient source, rate limiting/retry/audit неизвестны | OQ-06/08/11, FR-018 | Реальная verification policy и ответственность сервиса; фиктивный matcher не переносить |
| GAP-11 / Critical | Roles в Administration, локальные edit gates; POC DEV actor | Нет identity/session/revocation, capability/assignment/scope enforcement всех операций | OQ-06, FR-048, NFR-009–011 | Согласованная access matrix + session/security requirements |
| GAP-12 / Critical | Фото/operation queues localStorage, local Keep local changes; server sync отсутствует | Нет гарантированной durable записи, multi-device merge, ordering, acknowledgement/recovery | OQ-07, FR-046, NFR-001–006 | Offline/consistency matrix, conflict outcomes и fault acceptance |
| GAP-13 / High | PD-009 UUIDv7/alias, current Code128 ZB-ORDER-NN; research QR | Нет утверждённой symbology/hardware/replacement и совместимости старых labels | OQ-09, FR-030–034 | Матрица scan/print на целевых устройствах и переход ID/alias |
| GAP-14 / High | `InterstateReviewScreen`: generated Trip содержит totals/direction/truck, fixed sample ID/date/BOL; `interstateStore`: generatedTrip и selection в памяти | Outbound confirmed manifest не хранится в generated Trip как отдельный persistent snapshot; reload может терять load/review. Fixed IDs не production numbering | OQ-03/07/08, FR-036, NFR-003/005 | Требование authoritative manifest/version, уникальных business numbers и recoverability; не переносить constants |
| GAP-15 / High | Incoming manifests — отдельные fixtures; `completeUnloading` хранит tripId; UI пишет discrepancies opened | Нет persisted discrepancy records/lifecycle, связи outbound→incoming→Delivery и assignment следующей задачи | OQ-03/04, FR-037/038/042 | Контракты ownership/hand-off, discrepancy outcomes и приёмки |
| GAP-16 / High | Документные dialogs/Pickup email/SMS/call локальны; Interstate BOL browser print | Нет real PDF/assets/receipts, retry idempotency и delivery/retention; UI success не integration evidence | OQ-08/11, FR-025/026/044/045 | Delivery channel policy + real service acceptance |
| GAP-17 / High | `preTripInspectionDomain` и `postTripInspectionDomain`: фиксированная машина и markers | Нет vehicle assignment/repair/escalation/override; неясно кто снимает блокировку | OQ-12, FR-009/010 | Fleet context, Issue responsibility и approved gate boundary |
| GAP-18 / High | Stack/architecture — design references; POC OpenAPI только Create CargoPlace; SQL integration conditional | Нет согласованных NFR/load/SLA/devices, всеобъемлющих production contracts и runtime evidence POC | OQ-09/10/15, NFR-012–020 | Approved NFR и проверка применимости POC; API design — следующий этап |
| GAP-19 / High | Home блокирует route import/stop entry через routeUnlocked; `TasksScreen` показывает links без того же inspection gate; manual операции доступны | Прототип не задаёт универсальную safety/access policy для всех entry points. Глобальное распространение gate было бы новым решением | OQ-12/06, FR-004/009/048 | Явная таблица gate по entry point; UI сейчас не исправлять |
| GAP-20 / High | Active eligibility Loading — pickup_recorded+branches; физический loading UI до Create Trip, historical target — заранее assigned Trip | Pending Pickup snapshot не является явным eligibility condition; planned Trip vs created-after-review расходятся | OQ-03/04/08, FR-035/036 | Eligibility до interstate, assignment и Trip creation checkpoint |
| GAP-21 / Medium | `PickupSignatureScreen`: email copy только startsWithContact; OTP branch пропускает контактный signature step | Нельзя обещать ту же email-copy опцию при OTP без подтверждения; docs описывают её шире | OQ-08/11, FR-026 | Подтвердить ограничение signature branch либо отдельное изменение требований |
| GAP-22 / Medium | Separate barcode prompt iOS/Sheets, string External ID; Mobile App нормализует цифры | Нельзя слить несовместимые scopes/keys; риск коллизий и двойного владельца | OQ-03/13, FR-030/050 | Согласованный межпроектный scope и mapping, если нужен обмен |
| GAP-23 / Medium | Ignored DOCX/audit/internal OQ; screenshots могли отстать | Clean clone не содержит все первоисточники; исторические иллюстрации не являются точной screen specification | OQ-14, NFR-020 | Передаваемый evidence package; source/approved UI выше старых картинок |
| GAP-24 / High | Нет согласованного pilot/support/rollback/acceptance scope | Даже passing unit tests не определяют выпуск; неизвестны ресурсы, device QA и release gates | OQ-15, NFR-012/013/017/020 | Production acceptance evidence и критерии допуска; без roadmap в этой фазе |

## Граница требований и архитектуры

В ТЗ фиксируются пользовательский результат, invariants, данные и условия приёмки. Не выбраны физическая БД, framework, sync implementation, provider, endpoint payload или rollout roadmap. Существующий [OpenAPI](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/backend/openapi.yaml) рассматривается как контракт отдельного POC, не API всей системы. POC уже содержит validation/idempotency/permission checks, но `security: []` и DEV identity нельзя считать production auth.

Подтверждённые правила: раздельные Pickup/Dropoff, immutable подписанные версии, Supplemental, отдельный Interstate BOL, Order-owned movement_type и ownership PD-014. Неясные production детали не отменяют эти правила. В [ТЗ](TECHNICAL_SPECIFICATION.md) указан статус каждого FR; в [NFR](NON_FUNCTIONAL_REQUIREMENTS.md) — статус и предлагаемые, но не утверждённые качественные/численные критерии. AC в Draft становятся release gates только после согласования scope и затронутых OQ.

## Контроль качества этой фазы

Следующие результаты — первоначальная Phase 2. Свежие проверки синхронизации/архитектурного draft: [Release 1 checks](../current/RELEASE_1_DOCUMENTATION_CHECKS.md).

Количество FR/NFR/AC и покрытие источниками зафиксированы в [traceability](REQUIREMENTS_TRACEABILITY.md). Проверены уникальность IDs, обязательные поля каждого требования, local links/anchors, соответствие RTM каталогам, наличие sources/AC/status и SHA-256 исходных файлов. Старые результаты Phase 1 не выдаются за свежий browser/runtime прогон этой фазы.

| Проверка Phase 2 / 2026-10-16 | Результат | Граница |
|---|---|---|
| Структура и трассировка через Node fs/path | PASS: 50 FR, 20 NFR, 140 AC, 18 UC, 15 OQ, 24 gaps; нет пропущенных обязательных полей/дублирующихся requirement IDs; RTM статусы совпадают | Проверка целостности документов, не утверждение бизнес-решений |
| Статусы требований | 50 Confirmed, 12 Needs Decision, 8 Proposed | Confirmed — reference/принятые invariants, не production readiness |
| Markdown ссылки нового пакета и docs/README | PASS: 964 локальные ссылки, включая 497 heading anchors; missing targets/anchors нет | Внешние HTTP links и доступность ignored материалов в clean clone не проверялись |
| `wireframe: pnpm test` | PASS: 27 test files, 155 tests | Существующие reference tests; не тесты будущих production NFR/сервисов |
| `wireframe: pnpm exec tsc -b` | PASS | TypeScript, без изменения приложения |
| `wireframe: pnpm docs:prepare` | PASS: 27 help sources prepared | Requirements не добавлены в public help; config/scripts не менялись |
| SHA-256 до/после | Из 256 исходных проектных файлов изменён только `docs/README.md`; добавлены ровно шесть запрошенных requirements документов; удалений нет | Source/config/assets/backend/SQL/tests и уже существовавшие Phase 1 изменения сохранены без изменений этой фазой |
| Build / backend / database / browser/device runtime | Повторно не запускались | Нет изменений сборочных входов приложения; Phase 1 результаты не пересчитывались. Runtime БД/live providers не предоставлены; новые AC не объявлены пройденными |

Распространение POC idempotency/atomicity и единой audit schema на все production команды оставлено **Proposed** (NFR-003/015/019), а не выдано за утверждённую общесистемную архитектуру. Численные NFR остаются TBD. Mermaid diagrams проверены по описанным переходам и синтаксической структуре в source; отдельный Mermaid renderer не запускался.

Изменения этой фазы: шесть файлов `docs/requirements/` и ссылки/статус в `docs/README.md`. Commit/push, изменение decision log, baseline, приложения, моделей или конфигурации не выполнялись. Предсуществовавшие uncommitted изменения Phase 1 не присваиваются Phase 2.

## Первоначальная рекомендация о переходе к архитектуре (до BD)

Комплект структурно готов для review и обсуждения вариантов System Architecture & Integrations. Для окончательного архитектурного решения сначала согласовать блокеры из [OQ review](OPEN_QUESTIONS_REVIEW.md#блокирующие-решения-для-system-architecture--integrations), особенно production scope, masters/IDs, capability/assignment, offline/confirmation, signing freeze, media/hardware и измеримые NFR. Conditional boundaries communications/barcode уточняются при включении в scope. Не выдавать current POC или старые design references за окончательную архитектуру.
