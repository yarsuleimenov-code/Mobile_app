# BOL decision log

Исторический статус раннего инкремента: Этап 8 — data sync и автоматизированная проверка завершены; push в main был разрешён с принятым риском отсутствия rendered E2E на тот момент. Актуальное состояние всего приложения и границы документов см. в [CURRENT_STATE.md](docs/system-report/CURRENT_STATE.md); последующие браузерные проверки и этапы не отменяют решения BOL ниже.

Дата фиксации: 2026-08-25.

Product baseline дополнен 2026-09-01 по итогам BA weekly от 2026-08-31 и принятого Этапа 0. Полный реестр: [`docs/system-report/STAGE_0_PRODUCT_DECISIONS.md`](docs/system-report/STAGE_0_PRODUCT_DECISIONS.md).

## Реализовано на Этапе 1

- одна модель Order eBOL на один нормализованный Order number;
- lifecycle от `draft` до `completed` и `correction_requested`;
- Pickup/Delivery evidence snapshots;
- четыре позиции подтверждения: подпись контакта или OTP и обязательная подпись водителя на каждом этапе;
- versioned mock-хранилище `localStorage` с безопасным fallback;
- без UI, подписания, PDF и production-интеграций.

## Реализовано на Этапе 2

- CTA перехода из завершённого Pickup в Pickup eBOL review;
- единый review evidence: pieces, weight, volume, photos и exception;
- подтверждение внешнего Pickup contact: подпись на устройстве или проверенный OTP;
- отдельное подтверждение водителя Zaberman;
- damage не блокирует handoff, но требует описания;
- после подтверждения Pickup snapshot блокируется и сохраняется в mock `localStorage`;
- Delivery signatures, POD, настоящий PDF и production correction flow не добавлены.

## Реализовано на Этапе 3

- отдельный экран Pickup signing после evidence review;
- последовательность Pickup contact → Zaberman driver;
- проверенный OTP заменяет подпись внешнего контакта;
- signature pad поддерживает pointer drawing, очистку и demo signature;
- прямое открытие signing без review возвращает пользователя к review;
- рисунок подписи не сохраняется: модель хранит только signer, method и timestamp;
- Pickup snapshot блокируется только после подписи водителя;
- экран Delivery signing и POD остаются вне текущего этапа.

## Реализовано на Этапе 4

- SMS code доступен как явная альтернатива подписи Pickup contact;
- обязательны отправка и успешная проверка OTP;
- без успешной проверки OTP переход к signing заблокирован;
- проверенный OTP заменяет подпись Pickup contact, driver signing остаётся обязательным;
- signing screen показывает отдельный OTP verified summary;
- locked eBOL явно отличает OTP от обычной подписи;
- внешние уведомления, one-time link и production audit trail не добавлены.

## Реализовано на Этапе 5

- Dropoff сохраняет отдельный Delivery evidence snapshot с фотографиями и состоянием груза;
- Delivery доступен только после блокировки Pickup snapshot;
- damage не блокирует Delivery, но требует обязательного описания exception;
- добавлены Delivery review, подтверждение Delivery contact подписью или OTP и отдельная подпись водителя Zaberman;
- SMS code Delivery требует успешной OTP-проверки, подпись водителя остаётся обязательной;
- после подписи водителя Delivery snapshot блокируется, а Order eBOL получает статус `completed`;
- Pickup snapshot при этом не изменяется;
- POD preview, настоящий PDF, backend и юридически значимая подпись не добавлены.
## Реализовано на Этапе 6

- POD доступен только для Order eBOL со статусом `completed` и двумя locked snapshots;
- итоговый документ объединяет Pickup и Delivery evidence, фотографии и exceptions;
- показаны все четыре подтверждения, способы подтверждения и timestamps;
- POD остаётся представлением Order eBOL без отдельной модели, номера или lifecycle;
- добавлены mock-действия Download PDF, Print и Share с явной обратной связью;
- прямое открытие незавершённого POD показывает корректный blocking state;
- настоящий PDF, внешняя отправка, email и production permissions не добавлены.

## Реализовано на Этапе 7

- Home разделяет операционную навигацию и контекстный блок `Order documents`;
- каждый Order eBOL открывается на актуальном этапе: Pickup review, Pickup locked, Delivery review или POD;
- каноническое имя документа заказа — `Order eBOL`, а Pickup/Delivery используются как названия этапов и snapshots;
- `POD` используется только для итогового представления completed Order eBOL;
- во всех активных Interstate-входах используется явный термин `Interstate BOL`;
- маршруты и бизнес-lifecycle не изменялись, отдельный общий архив документов не добавлялся.

## Результат Этапа 8

- `Save Pickup` создаёт или обновляет Order eBOL draft в versioned mock-хранилище;
- изменения Pickup evidence синхронизируются до подписания;
- locked Pickup snapshot не перезаписывается повторным сохранением Pickup;
- автоматизированы сквозные сценарии signed, OTP, documented damage и переход к POD;
- проверены lifecycle guards, актуальная Home-навигация, storage fallback и все Order eBOL маршруты;
- unit/integration suite, TypeScript build и HTTP route smoke проходят;
- rendered end-to-end interaction и визуальная проверка остаются невыполненными из-за недоступности Browser runtime и отсутствия локального `npx/npm`;
- 2026-08-25: владелец прототипа разрешил push в `main`, приняв ограничение отсутствующей rendered E2E/visual QA.

## Цель

Устранить неоднозначность между BOL конкретного заказа и BOL межфилиального рейса, зафиксировать границы BA-прототипа и подготовить единый baseline перед изменением интерфейса.

## Контекст и источники

- BA weekly от 2026-08-24: согласована идея одного Order eBOL на Pickup/Dropoff с четырьмя позициями подтверждения; текущий способ подтверждения контакта уточнён в BOL-007.
- BA weekly от 2026-08-31: согласованы редактируемый Pickup, Supplemental Pickup после подписи, отдельные комментарии сторон и требование к сохранённой подписи сотрудника.
- Официальный uShip eBOL flow использован как ориентир для проверки evidence, подписей контакта и перевозчика, блокировки данных после подтверждения и итогового PDF после Delivery; способ подтверждения адаптирован к бизнес-правилу Zaberman.
- Исходный Zaberman wireframe на Этапе 0 содержал только Interstate BOL, привязанный к Trip manifest.

## Принятые решения

| ID | Решение | Обоснование |
| --- | --- | --- |
| BOL-001 | В продуктовой модели используются два независимых документа: Order eBOL и Interstate BOL. | У документов разные объекты, сценарии и участники. |
| BOL-002 | Order eBOL относится к одному Order и ведётся от Pickup до Dropoff. | Сохраняет непрерывную историю передачи конкретного заказа. |
| BOL-003 | Interstate BOL относится к одному Interstate Trip и его manifest. | Сохраняет текущую логику межфилиального рейса. |
| BOL-004 | Order eBOL предусматривает четыре позиции подтверждения: Pickup contact, Zaberman driver на Pickup, Delivery contact, Zaberman driver на Delivery. Контакт использует подпись на устройстве или OTP; водитель всегда подписывает. | Подтверждает обе точки передачи груза без неподтверждённой выдачи. |
| BOL-005 | Подпись означает ознакомление с evidence и исключениями, а не подтверждение отсутствия повреждений. | Позволяет завершать сценарий при документированном damage. |
| BOL-006 | До подписи данные этапа можно исправлять; после подписи snapshot блокируется. | Снижает риск незаметного изменения подтверждённых данных. |
| BOL-007 | Контакт подтверждает передачу подписью на устройстве или шестизначным SMS-кодом; иных способов выдачи нет. | Соответствует фактическому бизнес-процессу и исключает неподтверждённую выдачу. |
| BOL-008 | Damage не блокирует завершение этапа, если он зафиксирован как exception с evidence. | Отделяет факт передачи от состояния груза. |
| BOL-009 | POD — итоговое представление завершённого Order eBOL после Dropoff, а не третий независимый lifecycle. | Убирает дублирование документов и статусов. |
| BOL-010 | Order eBOL не связан с оплатой. | Payment flow не относится к цели согласования BOL. |
| BOL-011 | Первый инкремент — только интерактивный mock для согласования визуала и рабочих сценариев. | Проект не является production-решением. |
| BOL-012 | Существующий Interstate BOL не изменяется в первом инкременте. | Минимизирует scope и риск регрессии. |
| BOL-013 | Дополнительные места после locked Pickup оформляются Supplemental Pickup и новой version/addendum; исходный snapshot не разблокируется. | Не позволяет использовать старую подпись для нового состава груза. |
| BOL-014 | Контакт и представитель Zaberman имеют отдельные комментарии, включаемые в подписанный snapshot. | Сохраняет позиции обеих сторон и контекст исключений. |
| BOL-015 | Сохранённая подпись сотрудника применяется только после явного подтверждения документа либо по действующей ограниченной делегации с аудитом. | Исключает неконтролируемое автоматическое подписание и повторное использование подписи. |

## Термины

- **Order eBOL** — электронная карточка передачи одного заказа от Pickup до Dropoff.
- **Interstate BOL** — документ одного межфилиального Trip и его manifest.
- **Pickup snapshot** — заблокированный после подтверждения набор Pickup evidence и исключений.
- **Delivery snapshot** — заблокированный после подтверждения набор Delivery evidence и исключений.
- **POD** — итоговое представление завершённого Order eBOL.
- **OTP** — одноразовый SMS-код, который заменяет подпись внешнего контакта; код в документе не хранится.
- **Correction requested** — прототипный статус запроса на исправление уже подтверждённого snapshot.

## Scope первого инкремента Order eBOL

Включено:

- CTA перехода к eBOL после заполнения Pickup;
- review Pickup/Delivery evidence перед подтверждением;
- четыре mock-позиции подтверждения;
- OTP-подтверждение по SMS;
- locked state подтверждённого snapshot;
- фиксация damage/exception без блокировки завершения;
- финальный POD preview;
- mock-действия View, Print, Download и Share.

Не включено:

- юридически значимая электронная подпись;
- backend, внешние signing links и реальная отправка сообщений;
- генерация настоящего PDF и email;
- offline signing;
- production audit trail, versioning, correction/void workflow;
- интеграции со Spoke, CRM, TMS или платёжными системами;
- изменение существующего Interstate BOL.

## Открытые вопросы до production-проектирования

| ID | Вопрос |
| --- | --- |
| OQ-001 | Какой юридический текст подтверждения должен сопровождать подпись? |
| OQ-002 | Какой номер телефона является доверенным источником для OTP и кто может изменить его до отправки? |
| OQ-003 | Как нумеруются и визуально связываются correction, void, Supplemental Pickup и addendum? Product lifecycle уже принят в BOL-013. |
| OQ-004 | Какая система является источником номера Order eBOL? |
| OQ-005 | Каковы сроки хранения документа, подписей и evidence? |
| OQ-006 | Кто получает итоговый PDF и какими каналами разрешён Share? |
| OQ-007 | Какие legal/security ограничения применяются к `signed_pending_sync` при production offline signing? |
| OQ-008 | Какие фотографии и поля обязательны на Pickup и Delivery? |
| OQ-009 | Кто именно подписывает со стороны Zaberman при работе экипажа? |
| OQ-010 | Как эскалировать случай, когда недоступны оба разрешённых способа подтверждения контакта, не выдавая груз? |
| OQ-011 | Кто утверждает и отзывает делегацию на применение сохранённой подписи сотрудника? |

## Критерии завершения Product Этапа 0

- README и implementation plan различают Order eBOL и Interstate BOL.
- Текущий wireframe и production gaps для обоих типов документов описаны отдельно.
- Зафиксированы lifecycle, Supplemental Pickup, комментарии сторон, блокировка snapshot и scope mock-инкремента.
- Зафиксировано ограничение на сохранённую подпись сотрудника.
- Production-вопросы отделены от согласовательного прототипа.
- Последующие UI/data/API-изменения ссылаются на этот журнал и Stage 0 product decisions.

## Реализация Product Этапа 2 в wireframe

- Pickup draft автоматически сохраняется и восстанавливается из versioned `localStorage`.
- До подписи доступны add/edit/delete мест и change history.
- Locked snapshot version 1 не редактируется напрямую.
- Новые места оформляются Supplemental Pickup version 2+ с отдельными evidence и повторными mock-подписями.
- Реализация остаётся hi-fi business prototype и не означает production document versioning или legally binding signatures.
