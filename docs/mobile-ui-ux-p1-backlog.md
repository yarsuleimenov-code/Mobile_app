# Zaberman Mobile App — минимальный P1 implementation backlog

**Дата:** 2026-09-26  
**Источник:** `docs/mobile-ui-ux-audit.md`  
**Статус:** ready for product review; visual viewport gate blocked by Windows sandbox  
**Ограничение:** production-код на этом этапе не изменяется

**Утверждённый UI baseline:** существующий вариант приложения. Новый дизайн и новая композиция экранов не приняты. Все задачи ниже должны реализовываться минимальным diff внутри текущего single-screen формата, без смены визуального языка и навигационной модели.

## Цель

Снизить время и риск ошибки в ежедневных Pickup/Dropoff операциях без изменения бизнес-логики и без полного редизайна.

## Scope первой итерации

Включить только:

- task-card hierarchy;
- однозначное следующее действие;
- разделение operation/evidence/sync/exception statuses;
- безопасный Scan result pattern;
- компактную структуру одного рабочего экрана Pickup/Dropoff;
- эргономику dimension groups;
- короткое подтверждение завершения;

Не включать:

- новый дизайн или альтернативный visual concept;
- изменение утверждённой композиции Pickup/Dropoff экрана;
- wizard/staged navigation для ввода данных;
- новую архитектуру приложения;
- реальные backend/integration/hardware функции;
- визуальный ребрендинг;
- расширение Interstate/BOL;
- новые бизнес-процессы.

## Gate 0 — восстановить visual QA

**Problem:** управление интерактивным браузером и shell не запускается: `windows sandbox failed: helper_unknown_error: setup refresh had errors`.

**Required checks after recovery:**

1. Открыть опубликованное приложение с чистым состоянием.
2. Проверить Home, Tasks, Pickup, Dropoff, Scan, confirmation и More на 360/390/430 px.
3. Проверить длинный адрес, длинное имя клиента, 20 cargo places, 100 photos.
4. Проверить numeric keyboard на последнем поле dimensions.
5. Проверить sticky CTA, bottom navigation, safe areas, back/resume и scroll restoration.
6. Зафиксировать screenshot/evidence и обновить `docs/mobile-ui-ux-audit.md`.

**Exit criterion:** нет horizontal overflow и перекрытия CTA/navigation; все отклонения заведены в backlog с экраном и шириной.

## P1 backlog

### P1-01 — Точечная иерархия существующей task card

**Problem solved:** пользователь медленно находит следующую физическую точку и может выбрать неправильную операцию.

**Change:** без замены компонента и визуального стиля уточнить порядок информации:

- строка 1: `Pickup` / `Dropoff` + due/operation status;
- строка 2: address, максимум две строки;
- строка 3: time window;
- строка 4: customer · Order ID · Local/Same Day;
- один CTA: `Start`, `Resume` или `View details`;
- operation type передаётся текстом + icon, не только цветом.

**Acceptance criteria:**

- один компонент используется на Home и Tasks;
- address визуально заметнее customer и Order ID;
- Pickup/Dropoff различимы без цвета;
- длинные значения не создают horizontal overflow на 360 px;
- старт назначенной операции требует не более двух переходов.

**Effort:** Small  
**Dependency:** Gate 0 visual baseline

### P1-02 — Уточнить существующий primary action

**Problem solved:** в длинном Pickup/Dropoff flow теряется следующий шаг.

**Change:**

- сохранить существующий filled CTA и его расположение;
- проверить, что CTA остаётся доступным над bottom navigation/safe area;
- label описывает действие и объект: `Continue to photos`, `Review Pickup — 4 places`, `Complete Dropoff — 3 of 4`;
- disabled CTA сопровождается конкретной причиной.

**Acceptance criteria:**

- CTA доступен после прокрутки длинного списка;
- keyboard не перекрывает CTA или активное поле;
- нет двух визуально равнозначных CTA;
- back/resume сохраняет Order и текущий шаг.

**Effort:** Small

### P1-03 — Разделить четыре типа статуса

**Problem solved:** `Saved`, `Signed`, `Pending`, `Completed` и exception воспринимаются как один статус.

**Change:** показывать отдельно:

1. `Operation`: Not started / In progress / Ready / Completed / Partial / Refused;
2. `Evidence`: photos, labels, signatures completeness;
3. `Sync`: Saved on device / Pending / Syncing / Synced / Needs action;
4. `Issue`: Missing / Extra / Damaged / Wrong task / Refused.

**Acceptance criteria:**

- `Saved on device` никогда не выглядит как completed operation;
- sync state содержит text и timestamp;
- issue содержит icon + text + next action;
- цвет не является единственным носителем состояния;
- task card показывает максимум два badges.

**Effort:** Small

### P1-04 — Безопасный Scan result pattern

**Problem solved:** duplicate/wrong/unknown scan может быть принят за успешный и вывести пользователя из scan loop.

**Change:** единый result bottom sheet:

- outcome;
- PlaceID/Order;
- изменился ли progress;
- один primary action;
- secondary `View place`, если применимо;
- scanner остаётся готовым к следующему scan.

**Acceptance criteria:**

- duplicate: `Already scanned — count unchanged`;
- wrong task и unknown не меняют counters;
- success сразу обновляет `Expected / Scanned / Issues`;
- любой outcome различим без цвета;
- пользователь может продолжить scan loop одним tap.

**Effort:** Small  
**Dependency:** подтверждение существующего no-op поведения тестами

### P1-05 — Сохранить существующий рабочий экран Pickup/Dropoff

**Problem solved:** дополнительные переходы замедляют ввод на месте и скрывают уже введённый контекст.

**Change:** сохранить утверждённый длинный рабочий экран, текущую композицию, визуальный стиль, autosave и последовательные секции. Допускаются только локальные исправления labels, validation, status text и responsive behavior.

Pickup:

`Order context → responsible manager / packaging / comment → totals → dimension groups → photos → labels → Review`

Dropoff:

`Order context → expected/scanned/issues → cargo list/scan → photos/exceptions → recipient data → Review`

Не добавлять новые переходы или экранные этапы. Существующие переходы на Scan, label/document preview и итоговый Review/confirmation сохраняются без переработки IA.

**Acceptance criteria:**

- все редактируемые данные операции доступны в одном scroll-контексте;
- autosave status виден в верхней части экрана;
- sticky CTA ведёт только на итоговый Review и не перекрывает поля/фото;
- section header показывает краткий итог (`1 group · 3 pcs`, `3 photos`);
- возврат из Scan/labels/photo preview восстанавливает тот же Order и scroll context;
- incomplete section содержит конкретный missing count и ссылку/scroll-to-section;
- bottom navigation не конкурирует со sticky CTA.

**Effort:** Medium

### P1-06 — Эргономика dimension groups

**Problem solved:** компактный ряд Qty + пять полей создаёт риск неправильного значения и unit.

**Change:**

- Qty stepper;
- L/W/H имеют persistent labels и unit suffix;
- weight показывает value + unit + source;
- numeric keyboard и разумные min/max validations;
- `Copy previous group`;
- на 360 px weight/package переносятся на следующую строку;
- `Unknown` требует reason согласно текущему правилу.

**Acceptance criteria:**

- label остаётся видимым после ввода значения;
- невозможно перепутать inch/lb и пустое значение с нулём;
- validation указывает поле и способ исправления;
- 360/390/430 px без horizontal overflow;
- пересчёт places/labels остаётся согласованным с Qty.

**Effort:** Medium

### P1-07 — Короткое error-prevention confirmation

**Problem solved:** длинный review провоцирует механическое подтверждение.

**Change:** по умолчанию показать только:

- operation и Order;
- address;
- expected/actual places;
- open issues;
- evidence/signers;
- sync consequence;
- outcome-specific CTA.

Полные данные раскрываются по запросу.

**Acceptance criteria:**

- ключевые totals/issues видны на 390 px без прокрутки;
- CTA содержит outcome и count;
- Partial/Refused визуально и текстово отличаются от Complete;
- damage/refusal не маскируются наличием подписи;
- irreversible signing показывает document/version consequence.

**Effort:** Small

## Рекомендуемая последовательность

1. Gate 0 — visual baseline.
2. P1-01 task cards.
3. P1-03 status separation.
4. P1-02 primary/sticky actions.
5. P1-04 Scan result.
6. P1-05 progress header.
7. P1-06 dimension groups.
8. P1-07 confirmation.

## Definition of Done для P1-итерации

- проверки 360/390/430 px пройдены;
- основные операции доступны за 1–2 перехода;
- на рабочем экране виден один primary action перехода к Review;
- duplicate/wrong-task scan не меняет progress;
- operation/sync/evidence/issue статусы не смешиваются;
- длинные данные и keyboard не ломают layout;
- Pickup/Dropoff различимы без цвета;
- существующая бизнес-логика, snapshots и document versioning не изменены;
- automated tests и production build проходят;
- изменения подтверждены коротким повторным UX-review.

## Scope note

Same Day и остальные открытые бизнес-решения не входят в эту UI/UX итерацию. Они не блокируют демонстрацию целостного ежедневного workflow сотрудника и будут уточняться перед production-разработкой соответствующих функций.

Новый HTML design concept отклонён и не является источником требований. Источником UI baseline остаётся фактический опубликованный интерфейс.
