# Этап 6. Данные заказа и Spoke preview

Дата: 2026-09-02. Статус: реализовано, проверено и принято owner; опубликовано с Этапом 5 в `main`, commit `8756a6f`.
Предыдущий baseline этапов 3–4 — `1d2a2d2`. Текущий handoff — [CURRENT_STATE.md](CURRENT_STATE.md).

## Цель и scope

Owner может сравнить внешнее и рабочее название, отдельно увидеть количество, требования к обработке и будущие поля Spoke. Водитель может сохранить неполный Pickup и объяснить отсутствие измерений. Подписанный факт не меняется при последующем редактировании карточки.

Реализация следует [OWNER_DEMO_PLAN.md](OWNER_DEMO_PLAN.md), PD-011 и правилам полей Этапа 0. Это hi-fi wireframe: без API, adapters, PostgreSQL, production permissions и настоящего обмена со Spoke. В рабочих экранах нет demo/mock/simulate-пометок; ограничения ведущий раскрывает устно.

## Реализованный сценарий

- `Tasks → Order details`, также переход из Pickup, Dropoff и карточки CargoPlace.
- Длинный `trade_name` и источник Order master — read-only. Короткий `internal_name` используется в Tasks, Today’s stops, текущей карточке и labels; лимит 80 символов.
- Qty хранится и показывается отдельно. У `23343780` убрано встроенное в название «4×»; фактическое количество — пять мест из двух dimension groups.
- Сохранение данных заказа явное: Save order details, подтверждение, восстановление после reload. Ошибка хранения не даёт ложного success; введённый текст остаётся в форме.
- Изменения имени и Special Cargo записываются с ролью, временем и before/after. Внешнее имя и его источник команда редактирования не изменяет.
- Пустое internal name допускается при сохранении. В списке используется полное внешнее имя, а при его отсутствии — Order #. До review/подписи внутреннее имя необходимо заполнить.
- Special Cargo: Handling type и отдельные Handling details. У выбранного типа уточнение обязательно перед review, но неполные данные можно сохранить.
- Read-only Spoke preview показывает рабочее имя, Qty, адрес, время и комментарий существующего stop. Это preview исходящих полей, не свидетельство отправки и не editor внешнего сервиса. Для заказа вне текущего маршрута показано отсутствие stop.
- Неподписанный review/signing получает текущие данные заказа. Locked версии сохраняют собственную копию имени, Special Cargo и состояния измерений. Переименование текущей карточки не меняет original/POD или имя в reprint подписанных labels; новое дополнение получает новое имя.

## Роли и допущения

| Поле | Локальное правило |
|---|---|
| External name / source | Только чтение |
| Internal name | Dispatcher меняет; Supervisor может заполнить отсутствующее имя один раз |
| Special Cargo type/details | Только Dispatcher |
| Driver / Delivery crew / Warehouse / Administrator | Эти поля read-only |

В существующем wireframe нет ролей broker и crew lead. Для этой демонстрации Dispatcher представляет Dispatcher/broker, Supervisor — crew lead для заполнения отсутствующего имени. Новые роли и серверная модель прав не создавались. Это явно зафиксированное demo-mapping, не утверждение о production IdP.

`Fragile` и `Oversized` — примерные значения для демонстрации, а не утверждённый полный справочник. Примеры: `23343782` — стеклянная столешница, `23343778` — диван с подъёмом двумя сотрудниками. Уточнение справочника и mapping ролей остаётся вопросом owner.

## Неизвестные измерения

- Пять полей Qty/L/W/H/Weight остаются в одном ряду на 320/390 px.
- Новая группа содержит пустые nullable-измерения, а не фактические нули. Существующие нули черновика трактуются как unknown.
- Состояние размеров выводится из заполнения: complete / partial / unknown; отдельный флаг Dimensions cannot be measured даёт not_measurable.
- Для partial/unknown/not_measurable или неизвестного веса требуется общая причина группы. Autosave работает и без причины, переход в review блокируется с объяснением.
- Размеры и вес независимы: известный вес не превращает отсутствующие L/W/H в измеренный объём.
- Объём = сумма `Qty × L × W × H / 1728` только для complete-групп, округление до двух знаков.
- Вес = сумма только известных весов мест. При пропусках итоги помечены known; если известной величины нет — Not measured.
- Пример: три места 24×24×36 in по 18 lb + два места с неизвестными размерами/весом → Qty 5, известный вес 54 lb, известный объём 36.00 cu ft, два неполных места.
- Причины, counts и известные итоги видны в review, signing, версии документа, POD и Dropoff. Labels используют «—»/Not measured; CargoPlace показывает неизвестный вес с причиной.
- Сохранена совместимость старого распределения order total между местами: отсутствующее поле group.weight — legacy allocated, явный null — unknown.
- Existing Interstate получает пометку известных итогов вместо выдачи частичного веса/объёма за полный; его lifecycle не расширялся.

## Хранение и совместимость

Новый ключ `zaberman-order-details:v1` хранит локальные поля и историю по Order. Existing draft/cargo/eBOL keys сохранены; добавлены optional orderDetails/measurement summary, nullable величины и reason. Reset по прежнему удаляет все локальные `zaberman-*` данные после подтверждения.

Старые подписанные snapshots не мигрируют и не дополняются вымышленными именами или причинами: сведения, которых не было в них при подписании, задним числом не восстанавливаются. Новые подписанные версии фиксируют эти поля. Поддержка старых данных не является серверной миграцией.

Основные изменения: `orderDetailsDomain.ts`, `measurementDomain.ts`, CargoProvider, Pickup draft/domain, `OrderDetailsScreen`, Tasks/Home/labels, общие evidence-компоненты и review/signing. Тесты этапа — `orderDetails.test.ts`. Backend, SQL, package dependencies и архитектура providers не менялись.

## Проверка

- `pnpm --dir wireframe test`: 18 файлов / 86 тестов, включая 9 новых проверок ролей, лимита/fallback, audit, nullable round-trip, количества, объёма, исторических labels и Interstate totals.
- `pnpm --dir wireframe build`: TypeScript и Vite passed.
- Chrome/Playwright, `http://127.0.0.1:4173/Mobile_app/`, 320/390/1440 px, изолированные browser contexts. Browser plugin invocation failed: `trusted Node process exited unexpectedly; kernel reset`. Использован ранее разрешённый fallback, без новых зависимостей.
- Пройдено: Tasks → полное/рабочее имя → role-gated edit → save/reload/audit → Spoke preview; пустое имя → autosaved draft с блокировкой review → Supervisor fill-once; storage failure/recovery.
- Пройдено: новая группа Qty 2 → частичные размеры/причина → reload → Qty 5 в Tasks/labels → подпись → переименование текущего заказа → неизменные имя и причины original/reprint → Supplemental с новым именем.
- Проверены первый экран, mobile/desktop screenshots, пять полей в одном ряду, page identity, непустой UI, отсутствие framework overlay, горизонтального overflow и ошибок приложения. Временные QA scripts/screenshots находятся вне репозитория.
- Interstate browser-регрессия: место с unknown весом → Loading → Review → Trip → BOL сохраняет Not measured, не превращая неизвестное значение в фактический ноль.
- Регрессия Этапов 4–5: выборочная печать/Scan, comments, Supplemental, Delivery confirmation/exception, POD и Download/Print/Email/Share пройдены. Старый тест дополнения адаптирован к новой обязательной причине неполных измерений.
- Реальные Spoke, права пользователей, оборудование и серверная конкурентность не проверяются этим этапом.

## Приёмка owner и следующий шаг

Для просмотра: `Tasks → Order details · Spoke preview`, заказ `23343775`. Роль переключается заранее через служебный `#/more/demo → Role`. Основной показ не требует изменения кода или browser storage.

Owner принял Этап 6 и разрешил push в main перед Этапом 7. Следующий — **7. Репетиция owner-demo и UX-полировка**; работа над ним ещё не начата.
