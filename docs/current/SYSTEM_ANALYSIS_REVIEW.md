# Системный анализ: review пакета ТЗ v1.0

Дата: 2026-10-16. Получатели: owner, системный аналитик, mobile/backend leads и QA. Основание — локальные документы [пакета v1.0](../DEVELOPMENT_HANDOFF.md), не проверка API или production реализации. Это дополнение с рекомендациями; исходные требования, решения, манифест и код не изменены. Новых бизнес-решений или обязательного scope документ не вводит.

## Вывод

Пакет пригоден для передачи команде, декомпозиции и начала разработки. Бизнес-основа, workflows, сущности и критерии приёмки описаны. Однако это ещё не полная системная спецификация, по которой mobile/backend независимо реализуют одинаковые состояния и обмен: текущая архитектура прямо оставляет API-контракты, revisions и sync protocol открытыми.

Рекомендуется выполнять системную детализацию по рабочим срезам перед реализацией соответствующего взаимодействия. Доступы, тестирование внешних API и ответы на все вопросы заранее не требуются. Четыре RQ не пересогласовываются сейчас; обсуждаются при реализации затронутого участка. Числа требований и AC характеризуют структуру документа, а не полноту обработки всех отказов.

## Что уже достаточно описано

| Область | Оценка / основание |
|---|---|
| Scope и границы продукта | Достаточно для старта: ядро, Conditional/Deferred, внешний dispatch и iPhone/iPad — [Release 1 decisions](../requirements/RELEASE_1_DECISIONS.md#scope-первого-релиза) |
| Функциональная постановка | 50 FR с предусловиями, сценариями, исключениями и AC; 18 UC — [ТЗ](../requirements/TECHNICAL_SPECIFICATION.md), [workflows](../requirements/WORKFLOWS_AND_USE_CASES.md) |
| Бизнес-модель | Есть сущности/атрибуты и основные связи; физическая БД обоснованно не задана — [data requirements](../requirements/TECHNICAL_SPECIFICATION.md#data-requirements-на-уровне-бизнеса) |
| Логические компоненты и интеграционные границы | Есть backend/mobile/files/identity/Spoke и INT-01–07; это ориентир, а не подробный контракт — [архитектура](../architecture/SYSTEM_ARCHITECTURE_AND_INTEGRATIONS.md) |
| Сохранность и offline | Приняты local/server distinction, retry без дублей, immutable PDF и сохранение unsynced; нужны технические переходы и правила очереди |
| Трассировка и исполнение | 70 FR/NFR, 140 AC, DP-01–10; можно связывать задачи/QA с ID — [RTM](../requirements/REQUIREMENTS_TRACEABILITY.md), [план](../requirements/DEVELOPMENT_PLAN.md#пошаговое-задание-команде) |

## Замечания и рекомендации

Приоритет High означает риск переделки соответствующего модуля, а не запрет передачи ТЗ или остановку всех работ. Выводы относятся к документации: отсутствующий контракт не означает ошибку реализованной системы.

| ID / приоритет | Наблюдение и источник | Риск | Рекомендуемый результат детализации / когда |
|---|---|---|---|
| SA-01 / High | В data requirements есть Order/stopId/routeId, но production namespace/ключ операции не закреплён; PlaceID определён подробнее. [FR-002](../requirements/TECHNICAL_SPECIFICATION.md#fr-002), [FR-050](../requirements/TECHNICAL_SPECIFICATION.md#fr-050) | Один Order в нескольких stops/передачах или повторном визите может ошибочно получить общий draft/подпись | Словарь идентичности: Order, route, stop, handoff, version, place, file, command; связь manual/assigned контекста. Определить область уникальности, source ID и локальное создание ключей. До общего mobile/backend слоя данных |
| SA-02 / High | Разделение cargo fact/document/server confirmation описано словами, но нет полной таблицы переходов. [FR-016](../requirements/TECHNICAL_SPECIFICATION.md#fr-016), [FR-021](../requirements/TECHNICAL_SPECIFICATION.md#fr-021), [FR-022](../requirements/TECHNICAL_SPECIFICATION.md#fr-022), UC-05/08/17 | Один флаг completed может одновременно означать физическую передачу, local lock, server acceptance и доступный PDF | Матрица отдельных состояний operation, document version, sync и asset/job. Для каждого перехода: trigger, actor, guards, side effects, local/server authority, failure/retry. RQ-01/02 пометить в конкретных строках; до signing/Delivery |
| SA-03 / High | FR-022-AC2: повторный lock отклоняется; NFR-003-AC1: повтор команды возвращает исходный результат. Это неоднозначность уровня применения, а не доказанное противоречие бизнес-правил | После потери ответа клиент может получить ошибку вместо уже принятого результата либо создать вторую версию | Уточнить: та же operation identity и payload → replay результата; новая команда к уже locked версии → доменная проверка; reuse identity с другим payload → conflict. Описать scope ключа, revision и проверку авторизации replay. До общих command contracts |
| SA-04 / High | INT-01 содержит checklist, но не field ownership/mapping. Источник маршрута Spoke выбран, master всех Order полей не выбран. [Архитектура: SoR](../architecture/SYSTEM_ARCHITECTURE_AND_INTEGRATIONS.md#system-of-record-и-данные), [FR-050](../requirements/TECHNICAL_SPECIFICATION.md#fr-050) | Потеря контактов/Requirements, неверная склейка stops, внешний update перезапишет операционный факт | Таблица поле → semantic source → read/write owner → external mapping → missing/stale behavior. Формат Spoke до знакомства команды с API оставить непроверенным; не предполагать его payload/webhooks. RQ-03 уточнить при route update реализации |
| SA-05 / High | Ручной Pickup/Dropoff входит в reference; плановые данные создаются вне приложения, а доверенная связь неизвестного manual Order не определена. FR-011/020/050, data requirements | Ручная фиксация может создать второй Order или документ без связи с внешним заказом | Описать lookup существующего Order, привязку manual операции и исход unknown/неполного контекста. Не трактовать manual capture как разрешение создавать master Order; если нужен новый бизнес-исход — вынести точечный вопрос owner при этой задаче |
| SA-06 / High | Offline matrix есть, но dependency order, cancel/retry, crash recovery и revisions остаются открытыми. [NFR-002–004](../requirements/NON_FUNCTIONAL_REQUIREMENTS.md#nfr-002), [UC-17](../requirements/WORKFLOWS_AND_USE_CASES.md#uc-17) | Подпись уйдёт раньше evidence, старый ack подтвердит новую редакцию, retry повторно создаст место | Схема команды/результата и таблица очереди: dependencies, local commit, pending/in-flight/ack/conflict/error, восстановление после прерывания. Разделить технический retry и бизнес-конфликт; до реализации sync coordinator |
| SA-07 / High | Реальные фото/подписи/PDF обязательны, а граница сохранения metadata/файла и document job не определена. [NFR-007/008](../requirements/NON_FUNCTIONAL_REQUIREMENTS.md#nfr-007), [FR-025](../requirements/TECHNICAL_SPECIFICATION.md#fr-025), architecture sequence | Есть запись версии, но потерян файл; либо accepted cargo откатывается при сбое PDF; возможны orphan uploads | Согласовать техническую последовательность local file/metadata save, upload completion, привязки к версии и повторяемого PDF job. Задать поведение partial upload/job crash и очистки. PDF всегда из immutable snapshot, не current Order; до media/document реализации |
| SA-08 / High | BD-09 разрешает missing data с комментарием; нормальная структура, некорректные значения и недоступные сведения должны различаться. [FR-013/014/021](../requirements/TECHNICAL_SPECIFICATION.md#fr-014), validation table | Комментарий случайно начнёт обходить identity, подписи, Pre-trip или позволит malformed данные; либо останется старый hard photo minimum | Матрица поле → тип → known/missing → причина → validation → PDF отображение. Сохранить уже принятые границы: нет hard photo minimum, unknown не 0, подписи/контекст/save errors не отменяются. Уточнить охват комментария для нескольких отсутствующих полей, не вводя обязательный отдельный комментарий на каждое без решения |
| SA-09 / Medium | Полный доступ BD-06 выбран, identity/session/смена пользователя открыты. [FR-048](../requirements/TECHNICAL_SPECIFICATION.md#fr-048), [NFR-010](../requirements/NON_FUNCTIONAL_REQUIREMENTS.md#nfr-010) | Потеря pending при logout, запись старым actor после смены пользователя, ложное отождествление широких прав и доверенной личности | Описать onboarding/session/offline expiry/logout с pending, binding автора и подписанта. Не возвращать многоролевой branch RBAC. Полный read access не позволяет менять автора уже подтверждённого факта; до auth/local persistence |
| SA-10 / Medium | Имеются formulas/reference units, но production units/timezone/rounding не закреплены. [Расчёты](../requirements/TECHNICAL_SPECIFICATION.md#расчёты-и-точность), route workDate | Разные totals в app/PDF, дата рейса зависит от timezone устройства, потеря точности при обмене | Единый словарь единиц/точности/округления и времени: business date, occurrence, receipt, source timezone. Значения обосновать данными источника и бизнес-правилом, не копировать fixture defaults; до mapping/calculation/PDF |
| SA-11 / Medium | По два AC на требование — полезный минимум, но несколько AC проверяют наличие решения, а не реализацию. NFR-002-AC1/004-AC1/012-AC1 и RTM | Число 140 AC может ошибочно восприниматься как полное QA-покрытие, особенно concurrency/failure веток | Разделить readiness checks спецификации и product tests. Для каждого среза добавить cases: normal, missing data, invalid, replay, stale revision, interruption, failure. Связать с существующими FR/AC; не менять их Approved смысл автоматически |
| SA-12 / Medium | Printing/каналы Conditional, calls/Interstate позднее; архитектура описывает общие границы, но нет формальных внутренних contracts. INT-03/04/05, DP-06/08 | Mobile/backend по-разному реализуют error/result или ожидают неопределённый канал как обязательный | Сначала внутренние contracts ядра: inputs/results, required fields, revision, repeat/error semantics и event/file references. Внешние форматы — отдельный mapping команды. Недоступный канал должен иметь описанный результат; подключение Conditional не превращать автоматически в prerequisite ядра |

## Порядок дальнейшей работы

Рекомендуется два рабочих системных документа с таблицами по срезам, вместо нового большого комплекта: **System behavior & data contracts** (сущности, состояния, команды, ошибки) и **Integration mapping & sync** (внешние поля, очереди, dependencies, recovery). Это предлагаемые результаты следующей работы, пустые файлы не создавались. Можно выделить OpenAPI после определения конкретных контрактов; не копировать узкий POC API как API всего продукта.

| Шаг | Системная работа / результат | Основание | Кто / связь с разработкой |
|---|---|---|---|
| 1 | Словарь IDs и связей, owner полей, словарь состояний; правила повторов и revision checks | SA-01/02/03/04 | Аналитик + mobile/backend leads; совместная основа, затем foundation DP-03 |
| 2 | Срез «user → vehicle/Pre-trip → route → Tasks → Order/manual context»: transition table, внутренние запросы/результаты, source mapping с непроверенными полями явно помеченными | SA-04/05/09/10; RQ-04 при Issue recovery | Аналитик + integration lead; специфицировать для DP-04, доступы получает команда по задаче |
| 3 | Срез «Pickup → места/измерения/фото → local save → restart → sync»: поля/ошибки/очередь и cases | SA-01/03/06/07/08 | Аналитик + mobile/backend + QA; DP-05 и общий sync, без ожидания document freeze решения |
| 4 | Срез «review → contact/driver confirmations → signed version → PDF»: freeze/invalidation, snapshot/asset dependency, PDF retry | SA-02/03/07; RQ-01/02 | Аналитик + leads + owner по конкретной развилке; DP-06 |
| 5 | Срез «Dropoff → comparison → confirmations/POD», skip/active-route conflicts: transitions/outcomes и возврат к незавершённому | SA-02/04/06/08; RQ-03 | Аналитик + Operations/Dispatch при вопросе + QA; DP-07 |
| 6 | Реальные Conditional channels/printer и измеримые эксплуатационные параметры | SA-10/11/12; INT-04/05, BD-15 | Команда/QA при соответствующих задачах DP-08/09; не условие передачи ТЗ |

Не нужно заранее выбирать все backend технологии, запрашивать все доступы или закрывать весь OQ реестр. Техническое решение принимает команда в своей области; owner привлекается, когда меняется допустимый бизнес-исход. Interstate детализация остаётся поздним этапом.

## Минимальная готовность конкретного среза к согласованной реализации

Проверка относится к зависимому взаимодействию, а не к запуску всего проекта. Если один исход ждёт ответа, независимые работы продолжаются.

- Установлены участники, сущности/ключи и field owners; ссылки на FR/AC и scope указаны.
- Переходы описаны как «состояние + действие + guard → результат», включая сохранение, подтверждение и повтор; нет смешения operation/document/sync/file состояний.
- Mobile/backend одинаково понимают команду, результат и ошибки; непроверенные внешние поля обозначены, а не угаданы.
- Local/online/частичный сбой и восстановление имеют явный исход; старый ack не подтверждает новую revision.
- Есть примеры нормального, ошибочного и прерванного сценария; QA понимает ожидаемый результат. Нерешённая бизнес-ветка имеет конкретный RQ/ответственного.

## Проверка и границы review

Изучены handoff, scope/BD/RQ, архитектура, data requirements, целевые FR/NFR и workflows/RTM. Повторный полный аудит source не проводился: задача — review документации, а не независимая проверка всей реализации. Внешние API, инфраструктура, безопасность и устройства не тестировались. Содержание API Spoke/Twilio не предполагалось известным.

Все 12 замечаний имеют документальное основание, рекомендуемый артефакт и момент применения. Это аналитические замечания, не новые FR и не изменение 12 согласованных / 3 отложенных решений. Пакет v1.0 сохранён; этот файл — отдельное review к нему. При последующей правке требований выпустить новый срез пакета, не переписывать прежние SHA-256 задним числом.

## Выполнение рекомендованных действий

По поручению owner подготовлено отдельное дополнение [System Analysis SA-0.1](../system-analysis/README.md): общий словарь идентификаторов/revisions/состояний, внутренние QRY/CMD/ERR контракты, пять рабочих срезов, mapping/синхронизация/recovery/files и 28 проектных QA cases. Все SA-01–12 имеют связь с детализацией. Новые технические положения — Proposed для review команды; RQ и непроверенные внешние поля сохранены явно. Само review остаётся историей исходных замечаний, не доказательством implementation readiness или выполнения QA cases. Пакет v1.0 не менялся.
