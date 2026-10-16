# Системная спецификация Mobile App — SA-0.1

Дата: 2026-10-16. Дополнение к неизменённому [пакету ТЗ v1.0](../DEVELOPMENT_HANDOFF.md), подготовленное по поручению owner выполнить рекомендации [системного review](../current/SYSTEM_ANALYSIS_REVIEW.md). Получатели: системный аналитик, mobile/backend/integration leads и QA.

## Состав и порядок чтения

| Документ | Что получает команда |
|---|---|
| [SYSTEM_BEHAVIOR_AND_DATA_CONTRACTS.md](SYSTEM_BEHAVIOR_AND_DATA_CONTRACTS.md) | IDs/связи/revisions/время/units; бизнес-данные и missing validation; независимые состояния; ST-01–16; QRY-01–06, CMD-01–08, ERR; пять рабочих срезов SL-01–05 |
| [INTEGRATION_MAPPING_AND_SYNC.md](INTEGRATION_MAPPING_AND_SYNC.md) | MAP-01–12 с внешними полями, оставленными непроверенными; import/update; очередь/dependencies/recovery/conflicts; FILE-01–07; TC-01–28 и связь со всеми SA-01–12 |

Это проект семантических контрактов mobile/backend. Методы/URL API, physical database schema, framework, vendor limits и deployment не выдуманы. Числа требований и статусы пакета v1.0 не менялись: 70 FR/NFR, 140 AC. Новые ST/CMD/MAP/TC — детализация этих требований, не новые обязательные функции.

## Что фиксируется, а что ещё обсуждается

Обозначения B/T/D: Business confirmed — уже принятое правило; Technical proposal — предлагаемая детализация для review команды; Decision point — конкретная бизнес-развилка. Все новые имена полей, состояний и контрактов T. Даже полностью описанный технический вариант не считается автоматически утверждённым owner.

| Тема | Рабочая основа / когда уточнять |
|---|---|
| IDs и revisions | Общие ключи Order/stop/handoff/version/command, источник и display отдельно; выбрать конкретный encoding при technical review |
| Повторный lock | Повтор исходной команды возвращает исходный результат; новое lock-действие к locked версии доменно отклоняется. Это уточнение уровней FR-022/NFR-003 |
| RQ-01 | При signing уточнить freeze checkpoint; вариант первого подтверждения остаётся Proposed. Любой вариант сохраняет привязку сторон к увиденному evidence |
| RQ-02 | При correction/void уточнить процесс/повторные подписи; signed original не перезаписывается |
| RQ-03 | При active route updates уточнить отмены/переназначения; сохранять локальные факты/evidence |
| RQ-04 | При Issue recovery уточнить повторный Pre/смену cycle; reconnect сам Issue не снимает |
| Manual unknown Order / полностью неидентифицированный состав | При реальном кейсе owner уточняет допустимый исход. Missing-data comment не создаёт вымышленный Order/place. Не вводить новый hard Qty минимум за бизнес |
| Session/expiry, единицы, precision, retention, OS/printer/каналы | Команда уточняет технические параметры при соответствующих задачах; не придумывать SLA/TTL/legal сроки и не возвращать branch RBAC первого этапа |

Ответы на весь реестр не требуются до начала работы. Если конкретная ветка ждёт решения, команда продолжает независимые задачи. Никакой автоматической обратной записи фактов в Spoke, новой dispatch orchestration, Interstate или telephony integration этим дополнением не утверждено.

## Действия команды по срезам

1. Сверить общий словарь/контракты с mobile/backend leads: идентичности, revisions, authoritative результаты и error semantics должны совпадать у обеих сторон.
2. SL-01: реализовать session/vehicle/Pre-trip/route/Tasks на согласованной внутренней модели. Реальные поля Spoke заполняет integration команда; непроверенное в MAP остаётся явно обозначенным.
3. SL-02: реализовать Pickup, реальные файлы и устойчивое local save/restart/sync, используя dependency/replay матрицы. Не привязывать это к готовности PDF или всех RQ.
4. SL-03: при подготовке signing решить затронутые RQ-01/02, реализовать confirmations/immutable version/PDF. Не считать PDF готовым по одному metadata marker.
5. SL-04/05: реализовать Delivery/POD, skip и active route/session conflicts; вопросы RQ-03/04 и session policy обсуждать в соответствующих ветках.
6. QA переносит TC-01–28 в рабочую test систему со ссылками на исходные FR/AC и записывает фактические результаты. Cases — проект, они не выполнялись этой задачей.

Отдельно различать: сохранённый на устройстве draft, принятый сервером факт, locked signed version, доступный PDF и доставка копии. Failure/retry одного из этих контуров не создаёт ложный success другого.

## Версии и ограничения

Пакет v1.0 и его 17 SHA-256 сохраняются. SA-0.1 — отдельное дополнение, вход через этот README. После согласования команда может перенести technical contracts в рабочую OpenAPI/DTO/data model и выпустить следующий срез документов, сохранив происхождение бизнес-решений. Это не требует преждевременной смены manifest v1.0.

В текущей задаче только документация: код/UI/config/модели приложения не менялись, credentials не запрашивались, внешние API и устройства не тестировались. Commit/push не выполнялись. Проверки документационной целостности приводятся ниже; они не являются product acceptance.

## Проверки SA-0.1

PASS: локальные ссылки и anchors в трёх документах дополнения и системном review (39 ссылок, 20 anchors), структура 23 Markdown таблиц и закрытие fenced blocks. Идентификаторы проверены на уникальность и полноту: 16 ST, 6 QRY, 8 CMD, 5 SL, 12 MAP, 7 FILE, 28 TC; все 12 SA замечаний связаны с детализацией, ссылки FR/NFR существуют. Все 17 SHA-256 пакета v1.0 совпадают.

Git diff исходников wireframe/src, backend, database и app package/lock — без изменений; tracked whitespace check — PASS. Полная проверка новых таблиц выполнена отдельно от git diff, поскольку новые файлы ещё untracked. Build/tests повторно не запускались: изменения только в документации, TC-01–28 — проектные сценарии, не результаты выполнения.

Изменения: добавлены три файла docs/system-analysis/; к docs/current/SYSTEM_ANALYSIS_REVIEW.md добавлена ссылка на выполненную детализацию. Остальные документы/манифест v1.0 не редактировались.
