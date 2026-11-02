# Inbox / Calls — системное описание COM-001

**2026-10-27 · AS-IS реализованного прототипа, commit `0c948b4`.** Дополнение к SA-0.1 для mobile/backend leads и QA. [Принятое изменение и критерии COM-AC](../requirements/INBOX_CALLS_INCREMENT_2026_10_27.md), [FR-045](../requirements/TECHNICAL_SPECIFICATION.md#fr-045), [UC-16](../requirements/WORKFLOWS_AND_USE_CASES.md#uc-16). Этот документ описывает фактические локальные структуры/функции, а не новый production API или physical database schema.

Основание: COM-001 и принятие результата owner; код [callDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/0c948b46ff7ae4fe9e13de2956a63be8480253e8/wireframe/src/callDomain.ts), [communicationStore](https://github.com/yarsuleimenov-code/Mobile_app/blob/0c948b46ff7ae4fe9e13de2956a63be8480253e8/wireframe/src/communicationStore.tsx), [список звонков](https://github.com/yarsuleimenov-code/Mobile_app/blob/0c948b46ff7ae4fe9e13de2956a63be8480253e8/wireframe/src/screens/CustomerCallsList.tsx), [экран звонка](https://github.com/yarsuleimenov-code/Mobile_app/blob/0c948b46ff7ae4fe9e13de2956a63be8480253e8/wireframe/src/screens/OrderCallScreen.tsx), [Inbox](https://github.com/yarsuleimenov-code/Mobile_app/blob/0c948b46ff7ae4fe9e13de2956a63be8480253e8/wireframe/src/screens/CommunicationsScreen.tsx). R1-013/OQ-11 сохраняют отложенный статус реальной телефонии.

## Граница изменения

Уточнение сообщений COM-002 (2026-10-30, commit `a524ea0`; синхронизация документации 2026-11-02): первый элемент quickMessages — **We'll be there in 20 minutes**, затем On my way, Arrived, Running late, Please confirm access. useQuickMessage выполняет setDraft и фокусирует textarea; submit отдельно вызывает sendMessage(orderNumber, draft). Выбор шаблона не создаёт SmsMessage и не отправляет SMS. Draft можно редактировать; последующая отправка использует существующие online/offline queue/retry. Формат SmsMessage/CustomerCall, ключи localStorage и backend contracts не меняются. Источник: [OrderCommunicationsScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/a524ea0b8dda7701053c9fe25bc0eed73efa8119/wireframe/src/screens/OrderCommunicationsScreen.tsx).

Реализованы Inbox, Messages / Calls, локальная история входящих fixtures и исходящих визуальных звонков, Missed, поиск, перезвон, выбор контекста и индикаторы. Сообщения сохраняют прежнюю логику queue/retry/unread. Изменение не добавляет автоматическую синхронизацию операционных данных, предзагрузку маршрута, генерацию кодов, новые платформы или интеграцию оборудования.

Источники данных: `CommunicationProvider` владеет threads и calls; Cargo store предоставляет маршрут, а при его отсутствии UI использует `mockTodaySpokeRoute`. Backend/Spoke/provider не участвуют в истории звонков. Подтверждённый UX не означает, что `connected` является provider receipt.

## CustomerCall — локальная запись истории

| Поле | Тип / обязательность | Семантика AS-IS |
|---|---|---|
| `id` | string, да | У fixtures задан; новый исходящий создаётся локально через makeId. Не provider ID и не production identity contract |
| `customerName` | string, да | Snapshot имени контакта; для нового исходящего из выбранного thread |
| `customerPhone` | string, да | Snapshot отображаемого номера из thread/fixture; не подтверждение владения номером |
| `direction` | inbound / outbound, да | Направление. Новые локальные записи создаются только как outbound; inbound представлены fixtures |
| `outcome` | missed / completed / cancelled, да | Исторический результат, независимый от UI состояния и бизнес-обработки обращения |
| `startedAt` | string, да | Дата/время начала. Новый исходящий: Date.toISOString(); fixtures содержат offset. UI: en-US, часовой пояс устройства, без явной timezone подписи |
| `duration` | number, да | Секунды после соединения; completed отображается как m:ss. Нет provider billing/duration guarantee |
| `seen` | boolean, да | Признак просмотра для new missed. Не callback/resolved/delivery status; у новых исходящих true |
| `orderNumber` | string, нет | Зафиксированный контекст заказа; не заменяется более новым заказом того же номера |
| `operation` | pickup / dropoff, нет | Snapshot операции. На записи Calls dropoff подписан Delivery; в части существующих экранов остаётся Dropoff |
| `routeDate` | string, нет | Snapshot даты маршрута; новые исходящие сохраняют route.workDate только при наличии заказа в маршруте. Fixture формат MM/DD/YYYY не является утверждённым production date contract |

В CustomerCall отсутствуют `providerCallId`, `callbackOf`, `resolvedAt`, `endedAt`, actor/device и persistent association confidence. Не считать эти поля существующими или требовать их интеграции в рамках данного инкремента.

## Связь звонка с заказом

Алгоритм `callOrderCandidates(call, threads, routeOrders)`:

1. Если есть orderNumber, искать только thread этого заказа. Не переключать запись на другой заказ, даже если телефон совпал.
2. Иначе сравнивать номера после удаления всех нецифровых символов. Это упрощённый exact digits match, не полноценная E.164-нормализация.
3. Если среди совпадений есть заказы загруженного/fixture маршрута, оставить их; иначе оставить все совпадения контакта.
4. Один кандидат выбирается для показа автоматически; несколько требуют явного выбора. Это не сортировка по свежести заказа и не автоматический выбор последнего.

| Результат | Подпись и доступность |
|---|---|
| orderNumber уже записан | Related order. Даже если thread исчез, существующий номер сохраняется на экране; Open order/Call back без соответствующего thread не выводятся |
| Один найденный кандидат без записанной связи | Suggested order. Это предположение о контексте, не доказательство темы входящего звонка |
| Несколько кандидатов, нет выбора | Choose related order; Call back недоступен |
| Пользователь выбрал кандидата | Selected order; Open order/Call back доступны для выбранного thread |
| Кандидатов нет | Related order not identified / No matching customer order is available; произвольный набор номера из истории не реализован |

Выбор хранится только в React state строки. Он не записывает связь в исходный CustomerCall и теряется при размонтировании списка/перезагрузке. Перезвон создаёт отдельную outbound запись с выбранным orderNumber; исходная inbound/missed запись не редактируется. Один контакт может иметь несколько заказов; это не новая master-data модель контактов.

Дата маршрута на записи: сначала сохранённый call.routeDate, иначе дата текущего/fixture маршрута при наличии в нём выбранного заказа, иначе Unavailable. При fallback дата может измениться после обновления маршрута; стабильный исторический snapshot гарантируется только при сохранённом routeDate. В Messages/диалоге дата берётся из текущего/fixture маршрута. Дата маршрута не вычисляется из startedAt.

## Состояния и локальные операции

UI `CallStatus = ready / calling / connected / ended` отделён от `CustomerCall.outcome`. Запись не появляется при одном открытии ready.

| Событие | Переход / действие | История |
|---|---|---|
| Start call, online/slow | ready/ended → calling; сброс duration/Mute/Speaker; создание pendingCall в памяти | Пока без записи |
| Start call, offline | Кнопка Connect to call disabled, обработчик также запрещает старт | Без новой записи |
| Локальный таймер | calling → connected через 1400 ms; старт счётчика длительности | Визуальная имитация, не установленное соединение |
| Mute / Speaker | Переключение локальных флагов только в connected | Результат истории не меняется; управления аудио нет |
| End до connected | calling → ended | Одна outbound/cancelled, duration 0; UI сообщает отмену до соединения |
| End после connected | connected → ended | Одна outbound/completed с текущим duration |
| Внутренняя навигация с активного экрана | Effect cleanup завершает локальный сценарий; до connected — cancelled, после — completed | Одна запись; duration при уходе вычисляется по прошедшему времени |
| Call again | ended → calling с новым pendingCall | Следующее завершение создаёт отдельную запись |
| Reload/закрытие вкладки/crash активного call | PendingCall находится только в памяти; cleanup и запись не гарантированы | Восстановление активного звонка не реализовано |

`recordCall` добавляет запись в начало массива и присваивает id/seen=true. После End pendingCall обнуляется, поэтому последующий внутренний уход не дублирует завершённую запись. Это локальная защита, не provider event idempotency.

`seeMissedCalls` вызывает `markCallsSeen`: у всех текущих outcome=missed устанавливается seen=true. Effect срабатывает при входе в Calls, а не при просмотре каждой карточки или применении поиска. Outcome, число пропущенных и сами записи сохраняются. Нового признака «клиенту перезвонили/вопрос решён» нет.

## Списки, маршруты и индикаторы

| Элемент | Контракт AS-IS |
|---|---|
| Inbox | Home / Tasks / Scan / Inbox / More; заголовок Messages & Calls |
| Messages URL | `#/communications`; без `tab=calls` отображаются сообщения |
| Calls URL | `#/communications?tab=calls`; канал восстанавливается по URL |
| Thread / Call URL | `#/orders/:orderNumber/communications` / `#/orders/:orderNumber/call`; прежние пути сохранены |
| Open order | `#/orders/:orderNumber/details` |
| Back to calls / messages | Возврат в Calls либо thread того же заказа |
| Поиск Calls | trim/lowercase substring по имени, отображаемому телефону, записанному и найденным номерам заказов; phone search не нормализует формат |
| Сортировка | По Date.parse(startedAt) убыванию |
| All calls / Missed | Missed = outcome=missed независимо от seen; поиск сочетается с фильтром. Счётчики показывают общее число, а не размер текущей поисковой выдачи |
| Пустая выдача | No calls found; Show all calls очищает поиск и Missed |
| Messages badge | unreadTotal = сумма thread.unreadCount |
| Calls badge | newMissedTotal = count(outcome=missed AND seen=false) |
| Inbox badge | unreadTotal + newMissedTotal; это сумма непрочитанных сообщений и новых пропущенных событий, не число клиентов или требующих обработки заказов |

Пример индикаторов: 2 непрочитанных сообщения + 2 новых пропущенных = Inbox 4. После открытия Calls: Inbox 2, newMissedTotal 0, Missed всё ещё 2. После перезвона исходный Missed остаётся в истории, добавляется отдельный outbound.

## Сохранение и интеграционная граница

Завершённая история и seen сохраняются effect в `localStorage['zaberman-calls:v1']`; SMS остаются в `zaberman-communications:v1`. При отсутствии calls key либо ошибке JSON parse используется initialCustomerCalls. Полный reset в Administration удаляет оба ключа по префиксу `zaberman-`. Скрытие/смена вкладки канала не удаляет сохранённую историю.

Это не устойчивая production БД: схема/миграция и quota/write-error recovery не реализованы, активный pendingCall не persisted. История не ставится в operational sync queue и не отправляется в backend/provider. Нет cross-device read state, webhook/push, живых входящих, audio recording, background audio, provider failure/busy/no-answer либо подтверждения фактического перезвона. Потеря сети уже после старта не моделирует разрыв соединения.

Реальные каналы/номера/события/неизвестные номера/retention и восстановление после завершения процесса уточняются при отдельной работе по OQ-11/R1-013. Не переносить 1400 ms, local id, fixture контакты или формат routeDate в production как согласованные SLA/API. В этой задаче новые endpoints, таблицы и обязательные vendor поля не вводятся.

## QA и traceability

Cases ниже — критерии повторной проверки команды; наличие строки не означает новый выполненный тест. Историческое evidence реализации: 4 tests в [callDomain.test.ts](https://github.com/yarsuleimenov-code/Mobile_app/blob/0c948b46ff7ae4fe9e13de2956a63be8480253e8/wireframe/src/callDomain.test.ts), 7 tests в [communicationDomain.test.ts](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/communicationDomain.test.ts), общий прогон 159 tests и build:app; UI smoke Playwright/Edge 320/390/1280 px выполнен при реализации. Текущая задача меняет документацию; эти результаты не выдаются за повторный запуск.

| Case | Связь | Шаг / ожидаемый результат | Evidence реализации |
|---|---|---|---|
| CALL-TC-01 | COM-AC-01, FR-001 | Открыть Inbox из Home/нижнего меню; переключить Messages/Calls, обновить URL Calls → остаётся Calls | UI smoke |
| CALL-TC-02 | COM-AC-02, FR-045 | Проверить входящие/исходящие/missed, сортировку, контакт, отдельные Call time и Route date, m:ss для completed | Source review / UI history; отдельный timezone acceptance не выполнялся |
| CALL-TC-03 | COM-AC-03, FR-045 | Поиск по контакту/телефону/заказу вместе с Missed; пустая выдача → Show all calls | callDomain tests / UI smoke |
| CALL-TC-04 | COM-AC-04, FR-044/045 | Проверить формулу badge; открыть Calls → seen=true, Missed не исчезают; reload сохраняет результат | callDomain tests / UI smoke |
| CALL-TC-05 | COM-AC-05, FR-045 | Записанный orderNumber не заменяется другим; без связи приоритет у совпавших заказов маршрута, один → Suggested order | callDomain tests / UI smoke для Suggested order |
| CALL-TC-06 | COM-AC-06, FR-045 | Несколько кандидатов → без выбора нет Call back; выбрать → Selected order и перезвон по нему; без кандидатов нет чужого контакта | callDomain tests / UI smoke для выбора; zero-match UI case остаётся для команды |
| CALL-TC-07 | COM-AC-07, FR-045 | Call back → Start → Connected → Mute/Speaker → End → Back to calls; отдельная outbound/completed, исходный missed не закрывается | UI smoke; Speaker требует отдельной повторной проверки |
| CALL-TC-08 | COM-AC-08, FR-045 | End до соединения → cancelled/0; Call again → новая запись; уход после End не дублирует | UI smoke для cancelled/без дубля; отдельный Call again case для команды |
| CALL-TC-09 | COM-AC-09, FR-045 | Внутренний уход из calling/connected → одна cancelled/completed; уход из ready ничего не создаёт | Source review; отдельный UI case для команды |
| CALL-TC-10 | COM-AC-10, FR-045 | Offline: чтение/поиск доступны, Start disabled и новая запись не создаётся | UI smoke для запрета Start; сочетание offline+поиск проверить отдельно |
| CALL-TC-11 | COM-AC-11, FR-045 | После завершения и reload история/seen сохраняются; reset возвращает fixtures; выбранная связь исходного incoming не persisted | UI smoke для истории/seen; reset и ephemeral selection case для команды |
| CALL-TC-12 | COM-AC-12, FR-044 | Message/Call из заказа доступны; первый quick reply We'll be there in 20 minutes заполняет редактируемый draft без отправки, Send создаёт сообщение в том же Order; показана Route date, SMS queue/retry сохранены | communicationDomain tests / UI smoke quick reply; при реализации COM-002 проверены порядок, draft, отсутствие auto-send, явная отправка и 320 px; полная SMS regression не повторялась |

Проверки active reload/crash, неизвестного номера и provider failures фиксируют ограничения текущего прототипа; это не выполненные production cases. COM-AC/CALL-TC расширяют документацию принятого reference, а не автоматически включают телефонию в ядро Release 1.
