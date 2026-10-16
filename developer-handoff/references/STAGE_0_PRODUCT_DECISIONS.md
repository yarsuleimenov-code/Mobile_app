# Этап 0. Утверждённые продуктовые решения

Дата: 2026-09-01

Статус: принято как TO-BE baseline для следующего этапа реализации.

Основание: принятый план развития приложения, BA weekly от 2026-08-31, текущий wireframe, системный анализ и BOL decision log.

## 1. Цель и граница

Цель этапа — убрать неоднозначность в Pickup, CargoPlace, labels и Order eBOL до изменения DDL/API.

В scope:

- lifecycle Pickup и граница редактирования;
- изменение состава после подписи;
- комментарии участников handoff;
- внешнее и внутреннее название груза;
- правила идентификации и печати CargoPlace;
- неизвестные измерения;
- `movement_type`;
- минимальные permissions;
- использование сохранённой подписи сотрудника.

Вне scope: выбор конкретного IdP, модели принтера, object storage, сервиса email/PDF и поставщика master Order system. Эти решения не меняют бизнес-правила ниже.

## 2. Реестр решений

| ID | Решение | Статус |
|---|---|---|
| PD-001 | Pickup operation и Pickup eBOL snapshot имеют разные lifecycle | Принято |
| PD-002 | Редактирование разрешено до блокировки snapshot | Принято |
| PD-003 | После подписи исходный snapshot не разблокируется | Принято |
| PD-004 | Новые места после подписи оформляются Supplemental Pickup | Принято |
| PD-005 | Исправление подтверждённого факта создаёт correction/reversal | Принято |
| PD-006 | Комментарии контакта и представителя Zaberman хранятся отдельно | Принято |
| PD-007 | Внешнее и внутреннее название — разные поля | Принято |
| PD-008 | Special Cargo не используется как замена внутреннему названию | Принято |
| PD-009 | Barcode содержит opaque PlaceID; label содержит читаемый alias | Принято |
| PD-010 | Label генерируется локально и может печататься выборочно | Принято |
| PD-011 | Неизвестные вес/размеры допустимы только с явным quality state/reason | Принято |
| PD-012 | Канонический `movement_type` принадлежит Order | Принято |
| PD-013 | Сохранённая подпись сотрудника не применяется без подтверждения/делегации | Принято |
| PD-014 | Плановые данные и операционные факты имеют разных владельцев | Принято |

## 3. Lifecycle Pickup

### 3.1 Pickup operation

```text
draft → in_progress → ready_to_close → closed
                    ↘ cancelled
closed → reversed только отдельной supervisor-командой
```

- `draft` может существовать только на устройстве;
- `in_progress` редактируется и синхронизируется без создания нового Pickup;
- `ready_to_close` означает локальное завершение/offline ожидание server checks;
- только сервер устанавливает `closed`;
- correction не переписывает закрытую operation.

### 3.2 Pickup eBOL snapshot

```text
draft → review → signed_pending_sync → locked
locked → correction_requested → новая version/addendum
```

- Pickup operation и документ не объединяются в один статус;
- draft/review обновляются при изменении Pickup до подписи;
- после первой подписи набор evidence фиксируется;
- offline-подпись получает `signed_pending_sync`, но не показывается как server-confirmed;
- `locked` snapshot immutable.

## 4. Изменение состава заказа

### До подписи

Пользователь может сохранить и продолжить Pickup, добавлять/удалять CargoPlace, менять измерения, фотографии и комментарии. PlaceID уже созданного места не меняется.

### После подписи

Разблокировка исходного snapshot запрещена.

Если клиент передал дополнительные физические места:

1. создаётся новая `supplemental_pickup` operation для того же Order;
2. создаются новые CargoPlace с новыми PlaceID;
3. формируется addendum/следующая версия Order eBOL;
4. контакт и представитель Zaberman подтверждают только новый состав и связь с исходным документом;
5. исходные snapshots, labels и события сохраняются.

Если исправляется ошибочный факт без нового груза, используется correction/reversal с причиной, actor и временем. Замена значения без истории запрещена.

## 5. Комментарии при handoff

Для Pickup и Delivery используются отдельные поля:

- `contact_comment` — комментарий клиента/внешнего контакта;
- `zaberman_comment` — комментарий водителя или другого представителя Zaberman;
- `exception_note` — описание повреждения/отказа/расхождения;
- `otp_verification_sid` и статус проверки — технические атрибуты SMS-подтверждения; сам код в документе не хранится.

Обычные комментарии необязательны. `exception_note` обязателен при damage, refused, disagreement или supervisor override. Перед подписью обеим сторонам показывается итоговый evidence и оба комментария. После подписи поля входят в immutable snapshot.

## 6. Названия и Special Cargo

| Поле | Правило | Кто изменяет |
|---|---|---|
| `trade_name` | Полное внешнее название из source/master; используется для сверки и интеграций | Только master/adapter |
| `internal_name` | Короткое рабочее название до 80 символов для склада и водителя | Dispatcher/broker; crew lead может заполнить отсутствующее значение с audit |
| `quantity` | Отдельное число, не часть названия | Master или уполномоченный пользователь |
| `special_cargo_type` | Controlled value для груза с особыми требованиями | Dispatcher/broker |
| `special_cargo_details` | Обязательные уточнения по правилам выбранного типа | Dispatcher/broker |

`internal_name` обязателен до `ready_to_close`, но его отсутствие не блокирует сохранение draft. Special Cargo не перегружается назначением внутреннего названия.

## 7. CargoPlace и labels

- Primary PlaceID — immutable UUIDv7.
- Barcode payload: `schema version + opaque PlaceID`; Order, размеры и статус не кодируются.
- Human label показывает Order number, `n/N`, короткий alias и при необходимости обозначение dimension group.
- Labels генерируются на устройстве без сети; server API не нужен для построения изображения из уже выданного PlaceID.
- Доступны `Print all`, `Select to print`, `Print this label` и reprint.
- Reprint сохраняет PlaceID и active code; replacement создаёт новый alias и помечает старый replaced/void.
- Наклейки взаимозаменяемы только внутри одной подтверждённой группы с одинаковыми operational attributes. Между разными группами свободное распределение запрещено.
- После наклейки scan-test подтверждает связь кода с CargoPlace.
- Отсутствие принтера не блокирует draft: доступен save/manual fallback, но label-required handoff получает attention state.

## 8. Неизвестные измерения

Вес и каждая размерность могут быть неизвестны независимо.

Минимальный contract:

- `dimension_state`: `complete`, `partial`, `unknown`, `not_measurable`;
- L/W/H nullable; известные значения больше нуля;
- `weight_value` nullable;
- `weight_source`: `measured`, `declared`, `allocated`, `estimated`, `unknown`;
- `unknown_reason` обязателен для `partial`, `unknown`, `not_measurable` и неизвестного веса;
- volume рассчитывается только при полном L/W/H;
- totals не подменяют неизвестные значения нулём и отдельно показывают количество incomplete places.

Draft сохраняется с неполными данными. Переход к review разрешён с reason и warning; конкретные cargo/route policies могут сделать отдельные поля blocking.

## 9. Movement type и ownership

Канонический `movement_type` хранится на Order:

- `local_standard`;
- `local_same_day`;
- `interstate`;
- `interbranch_transfer`.

Task и RouteRun используют значение Order как read-only projection. RouteRun не может объединять Orders с несовместимыми типами. Interstate Trip остаётся отдельным агрегатом и всегда использует interstate workflow.

Ownership:

| Данные | Источник истины |
|---|---|
| Order, плановые Task/RouteRun, trade name | Утверждённый внешний Order/Dispatch master |
| CargoPlace, measurements, labels, operations, events | Zaberman operational DB |
| Trip/Manifest | Zaberman operational DB до появления утверждённого TMS master |
| Order eBOL/POD/Interstate BOL metadata и versions | Zaberman document module |
| Photos/PDF/signature assets | Object storage + Zaberman metadata DB |

Внешняя система определяется configuration `source_system`; интеграция использует immutable `external_id` и `source_version`. Dual write без одного владельца запрещён.

## 10. Минимальные permissions

| Capability | Worker/Crew lead | Driver | Supervisor | Dispatcher | Admin |
|---|---:|---:|---:|---:|---:|
| Создать/редактировать Pickup draft | Да, по assignment | По assignment | Да | Read-only | Нет |
| Добавить CargoPlace до lock | Да | По assignment | Да | Нет | Нет |
| Печатать/reprint label | Да | По assignment | Да | Read-only | Support |
| Подписать как Zaberman representative | По capability | Да | Да | Нет | Нет |
| Создать Supplemental Pickup | Запрос/по assignment | По assignment | Да | Нет | Нет |
| Correction/reversal closed fact | Нет | Нет | Да, с reason | По политике | Support only |
| Изменить movement type/assignment | Нет | Нет | Override | Да | Нет |
| Управлять users/devices | Нет | Нет | Нет | Нет | Да |

Каждая mutation проверяет permission, assignment и branch scope на сервере.

## 11. Сохранённая подпись сотрудника

- Подпись внешнего контакта не сохраняется для повторного использования.
- Signature image сотрудника является защищённым персональным asset, а не публичным JPG в репозитории.
- Стандартный flow требует явного подтверждения конкретного документа самим подписантом.
- Допускается server-side применение сохранённой подписи только при действующей документированной делегации, ограниченной ролью, типом документа и сроком.
- Каждый случай фиксирует signer, acting user/service, document version, timestamp, policy/delegation ID и checksum.
- Изменение даты документа не является основанием для повторного использования старой подписи.
- Полностью автоматическая фоновая подпись без подтверждения или делегации запрещена.

## 12. Критерии закрытия Этапа 0

- решения PD-001–PD-014 являются нормативным TO-BE baseline;
- открытые требования не маскируются mock-поведением;
- post-lock изменения не меняют исходный snapshot;
- DDL/API следующего этапа обязаны реализовать `movement_type` и incomplete measurements по этому документу;
- OpenAPI разделяет Pickup operation, document snapshot, Supplemental Pickup и correction;
- роли и server-side permissions проектируются по capabilities, а не по скрытию экранов;
- выбор vendors/hardware/legal wording может уточняться без изменения принятых lifecycle и ownership boundaries.
