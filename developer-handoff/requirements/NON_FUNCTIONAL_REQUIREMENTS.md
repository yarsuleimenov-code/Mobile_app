# Нефункциональные требования

**Draft 1.2, 2026-10-16.** Согласованная бизнес-основа: [Release 1 decisions](RELEASE_1_DECISIONS.md). Параметры TBD остаются открытыми. Применение и статусы — по [ТЗ](TECHNICAL_SPECIFICATION.md#статусы-и-правила-применения). Confirmed относится только к существующему принятому invariant; production параметры могут оставаться открытыми. Proposed/Needs Decision не являются обязательными до согласования. Это требования к результату, не выбор SQLite, PostgreSQL, framework, очереди, provider или hosting.

Применимость: NFR-005 (Interstate Close) — поздний модуль; NFR-014 — подтверждена платформа, hardware matrix ещё открыта; NFR-012/013/017/020 — эксплуатационные gates перед пилотом. Матрица offline ниже — рекомендуемая детализация принятой основы BD-07, не доказательство cold-start/background реализации.

## Каталог

### NFR-001

**Локальная сохранность**

| Поле | Требование |
|---|---|
| Статус | Confirmed |
| Описание / качество | Draft/evidence после успешного локального сохранения доступны для продолжения, в том числе без сети в уже доступном контексте. |
| Бизнес-граница | Saved on device отличается от серверного confirmed; write failure явно обозначается. |
| Метод проверки | Сохранить draft → завершить процесс/перезапустить в согласованных условиях → проверить draft и IDs; отдельно моделировать отказ локальной записи. |
| Связанные данные / workflow | Draft, Evidence, Local persistence / [UC-05](WORKFLOWS_AND_USE_CASES.md#uc-05) |
| Источник / обоснование | [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [PickupCaptureScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PickupCaptureScreen.tsx); [DropoffVerifyScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/DropoffVerifyScreen.tsx) |
| Зависимости | OQ-07 |
| Ограничение | Политики выгрузки/TTL и cold start отдельно OQ-07. |

- **NFR-001-AC1:** После подтверждённого save восстановлен тот же draft без дублирования мест.
- **NFR-001-AC2:** При отказе записи нет ложного Saved; пользователь видит необходимость retry.

### NFR-002

**Матрица offline/online**

| Поле | Требование |
|---|---|
| Статус | Needs Decision |
| Описание / качество | Утвердить какие операции доступны offline, какие только pending и какие требуют online. |
| Бизнес-граница | Прототип offline-friendly уже загруженного приложения; полноценный offline-first не доказан. |
| Метод проверки | Пройти согласованную матрицу ниже в airplane mode/после restart/при восстановлении сети. |
| Связанные данные / workflow | Cached task, Draft, Photo, Command / [UC-17](WORKFLOWS_AND_USE_CASES.md#uc-17) |
| Источник / обоснование | [Baseline](../PROJECT_BASELINE.md); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md) |
| Зависимости | OQ-07, OQ-06 |
| Ограничение | Cold start, login offline и доступ к чужому недавно созданному месту — отдельные неподтверждённые условия. |

- **NFR-002-AC1:** Для каждой строки матрицы утверждены cached prerequisites, permitted action и статус результата.
- **NFR-002-AC2:** Нельзя получить server-confirmed результат без серверного acknowledgement.

### NFR-003

**Идемпотентность операций**

| Поле | Требование |
|---|---|
| Статус | Confirmed |
| Описание / качество | Повтор одной команды с тем же operation identity не создаёт второй факт; конфликтный reuse не маскируется replay. |
| Бизнес-граница | BD-07: повторная отправка без дублирования принята как основа offline-friendly работы. POC подтверждает только Create CargoPlace; распространение на production проверяется отдельно. |
| Метод проверки | Повторить запрос после потерянного ответа; повторить ID с иным содержимым. |
| Связанные данные / workflow | Operation ID, Result, Business event / [UC-17](WORKFLOWS_AND_USE_CASES.md#uc-17) |
| Источник / обоснование | [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [OpenAPI POC](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/backend/openapi.yaml) ; [BD decisions](RELEASE_1_DECISIONS.md) |
| Зависимости | OQ-07, OQ-03 |
| Ограничение | Exact key scope, срок хранения и retry protocol требуют согласования. |

- **NFR-003-AC1:** Две попытки одной операции дают один business fact и исходный результат.
- **NFR-003-AC2:** Reuse ID с изменённым смыслом не создаёт незаметное второе событие/успех.

### NFR-004

**Конфликты устройств**

| Поле | Требование |
|---|---|
| Статус | Needs Decision |
| Описание / качество | Утвердить реакции на concurrent edits, отмену/переназначение и stale document confirmation. |
| Бизнес-граница | Reference Keep local changes не production last-write-wins policy; immutable facts не заменяются merge. |
| Метод проверки | На двух устройствах изменить одну revision; отдельно воспроизвести signed/assignment conflict. |
| Связанные данные / workflow | Entity/evidence revision, Conflict, Assignment / [UC-17](WORKFLOWS_AND_USE_CASES.md#uc-17) |
| Источник / обоснование | [photoEvidenceDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/photoEvidenceDomain.ts); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [Baseline](../PROJECT_BASELINE.md) |
| Зависимости | OQ-07, OQ-04, OQ-06 |
| Ограничение | Для финального AC нужна conflict matrix, не только happy-path retry. |

- **NFR-004-AC1:** У каждой включённой конфликтной пары есть agreed reject/merge/review outcome и ответственный.
- **NFR-004-AC2:** Старый acknowledgement не подтверждает новую revision и не переписывает signed snapshot.

### NFR-005

**Окончательное подтверждение Close**

| Поле | Требование |
|---|---|
| Статус | Confirmed |
| Описание / качество | Разделять локально готовую к закрытию операцию и окончательный серверный Close. |
| Бизнес-граница | Offline Close только ready_to_close; closed устанавливает сервер; document snapshot lifecycle отдельно. |
| Метод проверки | Потерять сеть до/после принятия Close и восстановить связь. |
| Связанные данные / workflow | Operation close state, Result, Document job outcome / [UC-13](WORKFLOWS_AND_USE_CASES.md#uc-13) |
| Источник / обоснование | [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [Confirmed flow decisions](../decisions/DECISION_LOG.md); [OpenAPI POC](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/backend/openapi.yaml) |
| Зависимости | OQ-07, OQ-08 |
| Ограничение | Active UI close markers не реализуют этот target service. |

- **NFR-005-AC1:** Без server confirmation операция не помечена authoritative closed.
- **NFR-005-AC2:** Повтор после uncertain response выясняет исход без второго закрытия; PDF failure не откатывает accepted cargo fact.

### NFR-006

**Восстановление операции**

| Поле | Требование |
|---|---|
| Статус | Confirmed |
| Описание / качество | Восстанавливать сохранённую незавершённую работу без повторного создания Order/place/evidence. |
| Бизнес-граница | Подтверждено для Pickup/Delivery/receive drafts; memory-only Loading/generatedTrip — gap, а не гарантированное восстановление. |
| Метод проверки | Прервать draft на каждом сохранённом шаге; восстановить; отменить/повторить navigation. |
| Связанные данные / workflow | Draft, Revision, LoadSelection, Recovery result / [UC-17](WORKFLOWS_AND_USE_CASES.md#uc-17) |
| Источник / обоснование | [pickupDraftStore](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/pickupDraftStore.ts); [DropoffVerifyScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/DropoffVerifyScreen.tsx); [interstateStore](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/interstateStore.tsx) |
| Зависимости | OQ-07 |
| Ограничение | Production invariant расширяется только по утверждённой offline/recovery матрице. |

- **NFR-006-AC1:** Pickup/Delivery/receiving draft восстанавливает свои IDs и сохранённые изменения.
- **NFR-006-AC2:** Неполное/несохранённое действие не становится completed после restart; граница recovery Loading явно согласуется.

### NFR-007

**Реальные media файлы**

| Поле | Требование |
|---|---|
| Статус | Confirmed |
| Описание / качество | Нужна проверяемая связь metadata с доступным оригиналом/производной evidence, upload status и целостностью файла. |
| Бизнес-граница | BD-08/10: реальные фото/подписи/PDF сохраняются с Order/handoff/version; metadata не заменяют файл. Физическое хранилище и лимиты не выбраны. |
| Метод проверки | Capture → локальное сохранение → прерывание upload → retry → открыть тот же файл/version. |
| Связанные данные / workflow | Photo/PDF asset, Metadata, Upload state / [UC-10](WORKFLOWS_AND_USE_CASES.md#uc-10) |
| Источник / обоснование | [photoEvidenceDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/photoEvidenceDomain.ts); [Baseline](../PROJECT_BASELINE.md); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md) ; [BD decisions](RELEASE_1_DECISIONS.md) |
| Зависимости | OQ-05, OQ-07 |
| Ограничение | Форматы, size/compression/checksum/limits и сроки локального хранения не утверждены. |

- **NFR-007-AC1:** После локального подтверждения файл доступен по своей evidence-ссылке в agreed offline scope.
- **NFR-007-AC2:** Ошибка/частичный upload не объявляется доступным серверным файлом; retry не меняет photo identity.

### NFR-008

**Retention и удаление**

| Поле | Требование |
|---|---|
| Статус | Needs Decision |
| Описание / качество | Утвердить retention, удаление, доступ, hold/correction rules для фото/подписей/PDF/messages/cache. |
| Бизнес-граница | BD-10: подписанные PDF не перезаписываются; очищать можно только подтверждённо синхронизированные локальные копии. Центральное auto-delete до retention policy не вводится. |
| Метод проверки | Для каждого data class проверить expiry, authorized delete, запрет удаления удерживаемой версии и cache cleanup. |
| Связанные данные / workflow | File, Signed evidence, Message, Local cache / [UC-18](WORKFLOWS_AND_USE_CASES.md#uc-18) |
| Источник / обоснование | [Baseline](../PROJECT_BASELINE.md); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md) ; [BD decisions](RELEASE_1_DECISIONS.md) |
| Зависимости | OQ-05, OQ-08, OQ-11 |
| Ограничение | Численные retention/TTL и законное основание определяет уполномоченный владелец политики. |

- **NFR-008-AC1:** Есть согласованная data-class retention/access/delete matrix и исключения.
- **NFR-008-AC2:** Очистка cache не удаляет единственную unsynced копию и не ломает сохранённую document reference по agreed policy.

### NFR-009

**Серверная авторизация**

| Поле | Требование |
|---|---|
| Статус | Confirmed |
| Описание / качество | Сервер проверяет подлинность зарегистрированного пользователя для чтения/изменения; в Release 1 он имеет все доступные действия и видит все данные приложения. |
| Бизнес-граница | BD-06 уточняет прежнюю branch/assignment модель: такие ограничения не обязательны первого этапа. Бизнес-инварианты подписания/immutable versions действуют для всех. |
| Метод проверки | Два зарегистрированных пользователя видят весь app scope; неподтверждённый actor не допускается online; подмена client role не даёт подлинной сессии. |
| Связанные данные / workflow | User, Capability, Scope, Assignment / [UC-18](WORKFLOWS_AND_USE_CASES.md#uc-18) |
| Источник / обоснование | [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [OpenAPI POC](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/backend/openapi.yaml) ; [BD decisions](RELEASE_1_DECISIONS.md) |
| Зависимости | OQ-06, OQ-12 |
| Ограничение | IdP, onboarding, logout, offline expiry и revocation требуют технической policy NFR-010. |

- **NFR-009-AC1:** Два зарегистрированных пользователя видят все данные приложения; незарегистрированный online actor не получает protected read и не применяет mutation.
- **NFR-009-AC2:** Подмена client role не даёт полномочий; POC DEV adapter не используется как production identity.

### NFR-010

**Сессии и revocation**

| Поле | Требование |
|---|---|
| Статус | Needs Decision |
| Описание / качество | Определить login/session/device registration, offline TTL, revocation и unsent-data поведение при logout. |
| Бизнес-граница | Рекомендуется явно ограничить cached access и не терять pending facts; provider/mechanism не выбран. |
| Метод проверки | Истёкшая/отозванная сессия онлайн и offline; logout с pending evidence; смена пользователя на устройстве. |
| Связанные данные / workflow | Session, Device, Cached scope, Pending operations / [UC-18](WORKFLOWS_AND_USE_CASES.md#uc-18) |
| Источник / обоснование | [Baseline](../PROJECT_BASELINE.md); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md) |
| Зависимости | OQ-06, OQ-07 |
| Ограничение | TTL/refresh, device sharing, secure storage параметры не согласованы. |

- **NFR-010-AC1:** Для expired/revoked/offline session задано agreed allow/deny/reauth outcome.
- **NFR-010-AC2:** Смена пользователя не раскрывает предыдущий scope и не теряет pending data без agreed recovery.

### NFR-011

**Защита подтверждений и подписи**

| Поле | Требование |
|---|---|
| Статус | Confirmed |
| Описание / качество | Не переиспользовать подпись контакта; сохранённую подпись сотрудника применять только с подтверждением либо ограниченной делегацией. |
| Бизнес-граница | PD-013; подпись — защищённый asset с traceable signer/actor/document version. OTP value не документный атрибут. |
| Метод проверки | Подписать две разные версии; попытаться reuse без consent/delegation; открыть document metadata. |
| Связанные данные / workflow | Signature asset, Confirmation, Delegation, OTP reference / [UC-07](WORKFLOWS_AND_USE_CASES.md#uc-07) |
| Источник / обоснование | [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [orderEbolDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderEbolDomain.ts); [deliveryOtpDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/deliveryOtpDomain.ts) |
| Зависимости | OQ-06, OQ-08 |
| Ограничение | Конкретные legal wording, verification evidence и asset protection design ещё не утверждены. |

- **NFR-011-AC1:** Применение employee signature без допустимого подтверждения/делегации отклонено.
- **NFR-011-AC2:** В signed metadata нет самого OTP; указаны метод/участник/версия и время по agreed policy.

### NFR-012

**Производительность и объёмы**

| Поле | Требование |
|---|---|
| Статус | Needs Decision |
| Описание / качество | Утвердить workload и измеримые response/capture/sync/print/doc criteria на целевых устройствах. |
| Бизнес-граница | Не использовать размер текущего bundle или 40/100 mock photos как production SLA. |
| Метод проверки | Согласовать набор orders/places/photos, размеры файлов, concurrency/network profile; измерить agreed percentiles. |
| Связанные данные / workflow | Workload, Timing result, Device/network profile / [UC-18](WORKFLOWS_AND_USE_CASES.md#uc-18) |
| Источник / обоснование | [Baseline](../PROJECT_BASELINE.md); [OpenAPI POC](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/backend/openapi.yaml) |
| Зависимости | OQ-10, OQ-09, OQ-15 |
| Ограничение | Новых численных нормативов в draft нет; таблица параметров ниже. |

- **NFR-012-AC1:** Есть утверждённые нагрузки, metric/percentile, целевые значения и метод измерения для основных действий.
- **NFR-012-AC2:** На согласованном workload измерения укладываются в утверждённые пределы; значения до решения TBD.

### NFR-013

**Доступность и надёжность**

| Поле | Требование |
|---|---|
| Статус | Needs Decision |
| Описание / качество | Утвердить допустимые outage/degraded modes, availability target и восстановление сервисов. |
| Бизнес-граница | Отказ внешнего канала не равен потере handoff evidence; operational fact и document delivery различаются. |
| Метод проверки | Сымитировать недоступность master/sync/media/document/OTP provider и восстановление. |
| Связанные данные / workflow | Dependency state, Pending facts, Recovery evidence / [UC-18](WORKFLOWS_AND_USE_CASES.md#uc-18) |
| Источник / обоснование | [Baseline](../PROJECT_BASELINE.md); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md) |
| Зависимости | OQ-07, OQ-10, OQ-11, OQ-15 |
| Ограничение | Availability window, RTO/RPO, support hours не согласованы. |

- **NFR-013-AC1:** Для каждой зависимости есть agreed degraded result и запрет ложного success.
- **NFR-013-AC2:** Availability и recovery критерии измерены в согласованном окне/среде; target значения TBD.

### NFR-014

**Устройства и hardware**

| Поле | Требование |
|---|---|
| Статус | Needs Decision |
| Описание / качество | Поддержать iPhone и iPad по BD-12; версии ОС и модели ещё согласуются. Направление печати — мобильный ролл-принтер, выбор/закупка отложены. |
| Бизнес-граница | Android не обязательная платформа первого этапа. Полный supported OS/device/printer matrix ещё Needs Decision; Code128 reference не доказывает SDK compatibility. |
| Метод проверки | На каждом утверждённом device/OS/printer сочетании пройти capture/scan/reprint/offline/reconnect. |
| Связанные данные / workflow | Device, OS, Printer/scanner, Compatibility result / [UC-11](WORKFLOWS_AND_USE_CASES.md#uc-11) |
| Источник / обоснование | [Baseline](../PROJECT_BASELINE.md); [PlaceLabelsScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/PlaceLabelsScreen.tsx); [ScanScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/ScanScreen.tsx) ; [BD decisions](RELEASE_1_DECISIONS.md) |
| Зависимости | OQ-09, OQ-10, OQ-15 |
| Ограничение | OS versions, минимальные ресурсы и device count не придуманы. |

- **NFR-014-AC1:** Есть approved supported/unsupported matrix и условия manual fallback.
- **NFR-014-AC2:** На supported комбинациях пройдены согласованные end-to-end hardware cases; недоступность устройства объясняется.

### NFR-015

**Журналирование и audit**

| Поле | Требование |
|---|---|
| Статус | Proposed |
| Описание / качество | Подтверждённые факты и corrections сохраняют traceable actor, occurrence time, receipt time, device/source и связь с исходным фактом/версией. |
| Бизнес-граница | Stage 0 подтверждает неизменяемую историю и audit подписания; единый состав полей для всех production событий предлагается для согласования. |
| Метод проверки | Создать/повторить/исправить факт; сравнить журнал с outcome и подписанной версией. |
| Связанные данные / workflow | Operational event, Audit, Correlation, Version / [UC-15](WORKFLOWS_AND_USE_CASES.md#uc-15) |
| Источник / обоснование | [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [OpenAPI POC](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/backend/openapi.yaml); [Confirmed flow decisions](../decisions/DECISION_LOG.md) |
| Зависимости | OQ-06, OQ-07, OQ-08 |
| Ограничение | Retention, доступ к журналам и перечень допустимых log fields — OQ-05/06/08. |

- **NFR-015-AC1:** По событию устанавливаются кто/что/когда/какую версию подтвердил; retry traceable без второго факта.
- **NFR-015-AC2:** Correction не удаляет исходное событие; из version видна связь с evidence и confirmations.

### NFR-016

**Ошибки и поддержка**

| Поле | Требование |
|---|---|
| Статус | Proposed |
| Описание / качество | Классифицировать validation/authorization/conflict/transient/device/storage/provider failures и показывать следующий допустимый шаг. |
| Бизнес-граница | Рекомендуется понятное сообщение без чувствительных payload; retry только при допустимости, не повторить бизнес-факт. |
| Метод проверки | Fault injection по классам; проверить draft/result, retry/cancel и correlation для поддержки. |
| Связанные данные / workflow | Error class, Attempt, Correlation, Draft / [UC-17](WORKFLOWS_AND_USE_CASES.md#uc-17) |
| Источник / обоснование | [Baseline](../PROJECT_BASELINE.md); [DropoffVerifyScreen](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/screens/DropoffVerifyScreen.tsx); [photoEvidenceDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/photoEvidenceDomain.ts); [OpenAPI POC](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/backend/openapi.yaml) |
| Зависимости | OQ-07, OQ-10, OQ-11 |
| Ограничение | Error taxonomy и каналы поддержки требуют согласования; API error DTO здесь не создаётся. |

- **NFR-016-AC1:** Каждый согласованный failure class имеет понятное действие без потери сохранённого draft.
- **NFR-016-AC2:** Пользователь не видит внутренние secrets/OTP/raw stack, поддержка может связать attempt с outcome.

### NFR-017

**Backup и восстановление**

| Поле | Требование |
|---|---|
| Статус | Proposed |
| Описание / качество | Проверить возможность восстановить authoritative facts и связанные media/doc versions после сбоя. |
| Бизнес-граница | Рекомендуется согласовать RPO/RTO и restore scope; конкретный storage/provider не выбирается. |
| Метод проверки | На согласованной тестовой среде выполнить restore и сверить linked data/files/versions/pending states. |
| Связанные данные / workflow | Facts, Media, Documents, Recovery point / [UC-18](WORKFLOWS_AND_USE_CASES.md#uc-18) |
| Источник / обоснование | [Baseline](../PROJECT_BASELINE.md); [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md) |
| Зависимости | OQ-05, OQ-10, OQ-15 |
| Ограничение | Нет утверждённых численных RPO/RTO или географии хранения. |

- **NFR-017-AC1:** Есть согласованные RPO/RTO и классы данных, охватываемые restore.
- **NFR-017-AC2:** Restore evidence подтверждает согласованную целостность фактов, версий и файлов, а не только факт запуска backup job.

### NFR-018

**Удобство и доступность интерфейса**

| Поле | Требование |
|---|---|
| Статус | Proposed |
| Описание / качество | Сохранить утверждённые screen composition/labels и проверить читаемость, фокус/ошибки и управление на целевых устройствах. |
| Бизнес-граница | Рекомендуется доступная обратная связь не только цветом и работа с keyboard/screen-reader где применимо; без redesign/нового стандарта по умолчанию. |
| Метод проверки | Пройти критические actions на agreed widths/input modes с длинными названиями/адресами и error states. |
| Связанные данные / workflow | Screen content, Focus, Error feedback / [UC-01](WORKFLOWS_AND_USE_CASES.md#uc-01) |
| Источник / обоснование | [Baseline](../PROJECT_BASELINE.md); [StopNavigation](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/StopNavigation.tsx); [orderDetailsDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/orderDetailsDomain.ts) |
| Зависимости | OQ-09, OQ-15 |
| Ограничение | Compliance standard, accessibility level и точная responsive/device matrix не утверждены. |

- **NFR-018-AC1:** Номер/operational name, полный адрес и основное действие читаемы без скрытия обязательной информации.
- **NFR-018-AC2:** Ошибки и состояние действия определяются доступным текстом; approved navigation/flow сохранены.

### NFR-019

**Целостность бизнес-фактов**

| Поле | Требование |
|---|---|
| Статус | Proposed |
| Описание / качество | Применять связанные изменения атомарно, сохранять неизменяемые snapshots/events и quality states. |
| Бизнес-граница | POC подтверждает atomic Create CargoPlace; границы атомарности остальных handoff/Trip/document commands предлагается определить после требований. |
| Метод проверки | Прервать применение операции; проверить отсутствие частичного подтверждённого факта и корректный retry. |
| Связанные данные / workflow | Command, Place, Evidence, Event, Quality state / [UC-18](WORKFLOWS_AND_USE_CASES.md#uc-18) |
| Источник / обоснование | [Stage 0 PD-001–014](../references/STAGE_0_PRODUCT_DECISIONS.md); [OpenAPI POC](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/backend/openapi.yaml); [cargoDomain](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/wireframe/src/cargoDomain.ts) |
| Зависимости | OQ-03, OQ-07, OQ-08 |
| Ограничение | Транзакционные границы для handoff/Trip/document отдельно согласуются; физическая БД не выбирается. |

- **NFR-019-AC1:** Не существует authoritative accepted place без согласованного минимального набора связанных фактов/metadata.
- **NFR-019-AC2:** Повтор/сбой не нарушают immutable evidence, уникальность identity и явное unknown measurements.

### NFR-020

**Проверяемость и передача**

| Поле | Требование |
|---|---|
| Статус | Proposed |
| Описание / качество | Согласовать acceptance pack: requirement/source/version, tests, device/integration evidence, unresolved decisions и операционная готовность. |
| Бизнес-граница | Рекомендуется отличать reference unit tests, production integration tests и approval; private source availability отдельно OQ-14. |
| Метод проверки | Повторить agreed tests на pinned source/docs версии и проверить доступность evidence новому участнику. |
| Связанные данные / workflow | Requirement, Test evidence, Decision, Source version / [UC-18](WORKFLOWS_AND_USE_CASES.md#uc-18) |
| Источник / обоснование | [Baseline](../PROJECT_BASELINE.md); [Confirmed flow decisions](../decisions/DECISION_LOG.md); [OpenAPI POC](https://github.com/yarsuleimenov-code/Mobile_app/blob/1abe03ce0cd54697dedf713a0657c5f41f69ece3/backend/openapi.yaml) |
| Зависимости | OQ-14, OQ-15 |
| Ограничение | Не является утверждённым rollout plan или разрешением на pilot. |

- **NFR-020-AC1:** В RTM нет требований без источника/AC/статуса, а неподтверждённые пункты не объявлены обязательными.
- **NFR-020-AC2:** Production acceptance содержит agreed offline/device/integration/restore проверки и явные незакрытые ограничения.

## Матрица offline/online для согласования

Строки уточняют NFR-002 и связанные FR, не вводят новый обязательный offline scope. Предлагаемая граница — Proposed до OQ-07 вместе с access/file/document policy. Отсутствие сети не может считаться successful OTP verification или подтверждённой внешней отправкой.

| Функция | AS-IS / cached prerequisite | Рекомендуемая граница результата | При reconnect / отказе | Решение и связь |
|---|---|---|---|---|
| First login / новый device | Реального login нет | Online verified identity; offline вход только с согласованной cached session | Reauth/revocation, не demo role switch | OQ-06/07; NFR-009/010 |
| Cold start | Только already-loaded browser | Отдельно проверить cached app/data; не обещать cold start без решения | Нет cache — объяснить недоступность | OQ-07/09; NFR-002 |
| Tasks/Order/contacts | Fixtures/local context | Читать ранее доступные данные со stale indication по policy | Refresh/cancel/assignment conflict не стирает draft молча | OQ-03/06/07; FR-003/005 |
| Pickup groups/measurements | Draft local | Сохранить editable работу как local/pending | Отправить в agreed order, конфликт требует разрешения | OQ-07; FR-011–014 |
| Photos | Mock metadata queue | Capture/local files при достаточном ресурсе; upload отдельно | Retry/resume без дублирования; low storage — явная ошибка | OQ-05/07; NFR-007 |
| Labels/print | Code128 preview/mock print | Генерация из выданного ID без server roundtrip; print на supported hardware | Reprint тот же ID; printer unavailable — save/manual fallback | OQ-09; FR-030–032 |
| Lookup/operational scan | Local catalogue/manifest | Различать cached match и недоступный набор; pending факт по policy | Проверить membership/assignment при подтверждении | OQ-03/07/09; FR-033/034 |
| Signature/snapshot | Local markers/lock | Local pending confirmation при approved policy, не server closed | Отказ/конфликт без изменения исходного evidence | OQ-06/07/08; FR-016–019/022 |
| OTP | Offline delivery error | Verification только по trusted outcome; device signature — подтверждённая альтернатива, допустимость в конкретном случае по policy | Expiry/re-send/limits из approved contract | OQ-08/11; FR-018 |
| Dropoff/completed eBOL | Локальные статусы | Сохранить evidence; authoritative completion по agreed checkpoint | Reconcile pending и document state без второго handoff | OQ-04/07/08; FR-021–023 |
| Loading/receiving/Close | Receive draft persisted; outbound memory-only | Сохранить набор/manifest reference по agreed recovery scope; final Close pending до server ack | Idempotent close/reconciliation, stale manifest policy | OQ-03/04/07/08; FR-036–038 |
| Documents/PDF/email/share | Dialogs; browser print BOL | Читать cached signed version при правах; внешняя отправка pending, не delivered | Generation/delivery result и отдельный retry | OQ-06/08/11; FR-024–026/039 |
| Messages/calls | Local queue/visual call | Messages queue; real call зависит от сети/provider | Не терять pending; receipts из канала | OQ-07/11; FR-044/045 |
| Inspections | Local checks/photo markers | Сохранить draft; completion/gate в agreed vehicle/session scope | Не снимать Issue по самому reconnect | OQ-06/07/12; FR-009/010 |
| Logout/cache cleanup | Reset не production policy | Не терять единственную pending копию; выход/очистка по policy | Безопасная смена user и recovery handover | OQ-05/06/07; NFR-008/010 |

## Параметры без утверждённых чисел

Новые численные значения не предлагаются без нагрузки/целевых устройств. Рекомендуется способ измерения, значение остаётся **TBD / Needs Decision**. Reference 6 цифр OTP, 3 attempts/sends, group Qty clamp, 40/100-photo presets и последние 20 print attempts не задают SLA или production policy.

| Параметр | Предлагаемый способ задать критерий | Значение / решение |
|---|---|---|
| UI response, scan feedback, draft save | Action boundary, percentile, device, cached dataset, network profile | TBD; OQ-09/10/15 |
| Startup/cold offline | Раздельно warm/cold/first-install состояния | TBD; OQ-07/09/10 |
| Photos/files | Size/count per operation, quality/formats, минимальный свободный ресурс | TBD; OQ-05/09/10 |
| Sync | Dataset, acceptable pending age, bandwidth, interruption; local feedback отдельно от outcome latency | TBD; OQ-07/10 |
| Docs/print/messages | Generation/queue/delivery timing по этапам; hardware/provider availability | TBD; OQ-08/09/11 |
| Capacity | Users/devices/concurrent edits, orders/places/events/day, media growth | TBD; OQ-01/10/15 |
| Availability/recovery | Измеряемое окно, допустимые degraded modes, RPO/RTO, restore scope | TBD; OQ-10/15 |
| Retention/cache/session TTL | По data class/role; retention отдельно от freshness | TBD; OQ-05/06/07/08/11 |
| Devices/OS/accessibility | Модели/версии/input modes и целевой уровень по решению owner/QA | TBD; OQ-09/15 |

AC с TBD не выполнен до утверждения значения и метода. Проверка браузерного прототипа не измеряет эти NFR будущего приложения.

