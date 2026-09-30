# Zaberman mobile wireframe

Интерактивный mobile-first прототип фиксации груза менеджерами Pickup/Dropoff. Маршрут на день остаётся в Spoke и не дублируется в Zaberman.

Публичный прототип: https://yarsuleimenov-code.github.io/Mobile_app/

Актуальная граница реализации: [`docs/system-report/CURRENT_STATE.md`](../docs/system-report/CURRENT_STATE.md). Бизнес- и пользовательская документация: [русская версия](../docs/mobile-app/ru/README.md) и [English version](../docs/mobile-app/README.md).

Текущая цель — hi-fi wireframe для демонстрации owner. Переписанный [план этапов 3–7](../docs/system-report/OWNER_DEMO_PLAN.md): mock-фото/offline → labels → eBOL/POD → данные заказа/Spoke preview → репетиция показа. Backend, реальные интеграции, оборудование и полевой пилот в demo-scope не входят.

Правило показа: обычный UI без Simulate/demo/mock/prototype-пояснений; о природе прототипа ведущий предупреждает owner устно. Действия и статусы выглядят как будущий продукт, но интеграции остаются локальными имитациями. По запросу owner от 2026-09-03 служебная панель снова доступна через More → Administration, а также напрямую по `#/more/demo`. Вход показывает существующие настройки роли, филиала, сети, устройств и сценариев; новую систему прав доступа не добавляем.

## Запуск

```powershell
pnpm install
pnpm dev
```

Открыть `http://127.0.0.1:5173/`. Команда `pnpm build` формирует единый Pages artifact: приложение в `dist/` и документацию в `dist/help/`. Проверка состава artifact: `pnpm pages:verify`.

### Документация

Исходники находятся в `docs/mobile-app/` и `knowledge-base/mobile-app/`. Сгенерированный VitePress-контент не редактируется вручную.

```powershell
pnpm docs:prepare
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

Локальный preview после сборки: `http://127.0.0.1:4174/Mobile_app/help/`. Конфигурация и статус реализации описаны в [`DOCUMENTATION_SITE_IMPLEMENTATION.md`](../docs/system-report/DOCUMENTATION_SITE_IMPLEMENTATION.md).

Срез 2026-09-30: текущий source включает Pre-trip inspection и подтверждение контакта подписью или OTP во всех Pickup и Delivery. Этапы 3–6 приняты owner; отдельная бизнес-приёмка Этапа 7 документально не подтверждена. Повторная проверка frontend: 23 test-файла / 123 теста, TypeScript и Vite build проходят. Исторические две репетиции 7/7 на 320/390/1440 px описаны в [Этапе 7](../docs/system-report/STAGE_7_OWNER_DEMO_REHEARSAL.md).

## Что оценивать

- Home: быстрый выбор операции, Today’s stops, контекстная навигация `Order documents` и последние операции.
- Pickup: автосохраняемый draft, восстановление после перезапуска, dimension groups (Qty, L/W/H, вес одного места), add/edit/delete, change history, автоматические итоги и фотографии. Отдельные PlaceID сохраняются внутри групп.
- Locked Pickup: исходная версия read-only; новые места оформляются через Supplemental Pickup, новую document version и новые mock-подписи.
- Фото: отдельные ID, пять категорий, фильтр/preview и удаление конкретного фото; mock camera/gallery, локальная очередь с persisted retry/conflict. Фото original/supplemental/Delivery отображаются отдельно в review/POD.
- Dropoff: поиск заказа, сравнение Pickup evidence, Delivery-фотографии и фиксация damage/exception без блокировки передачи.
- Нижнее меню: `Home | Tasks | Scan | More`; Pickup и Dropoff открываются из Home/Tasks, Interstate — из More.
- Administration (`#/more/demo`): роль/филиал, online/offline/slow, результаты sync/print/email/SMS/OTP, доступность camera/scanner/printer и полный сброс локальных данных.
- More → Cargo places: стабильный `PlaceID`, Order и `n/N`, размеры/источник веса, label, current location/status и короткая event history для каждого места.
- Labels: all/selected/one, отдельные Original/Supplemental filters, точный preview и история mock print/reprint. Scan различает valid/duplicate/unknown и поддерживает ручной PlaceID/OrderID.
- Interstate: выбор направления и truck, загрузка конкретных мест, review manifest, создание Trip и `Interstate BOL`.
- Interstate BOL archive: поиск текущих и закрытых Trip-документов по номеру, TripID, направлению или truck.
- Контрольный пример: заказ `#11155599`, итоговый объём `273.44 cu ft`.

## Демо для owner

Home → Load today’s route → Pickup: заявки `23343775`, `23343778`, `23343780`, `23343782` открываются с mock-размерами, количеством, весом, упаковкой, ответственным, комментарием и тремя демонстрационными фото. Dropoff-заявки маршрута уже связаны с существующими Cargo records.

Пример `23343775`: 3 стула × 24 × 24 × 36 in, 18 lb/place → 54 lb и 36.00 cu ft. Изменение Qty на 4 → 72 lb и 48.00 cu ft. Новые planned Pickup не становятся выполненными от одного открытия формы.

Сохранённые правки имеют приоритет перед шаблоном. Служебный блок с `Load demo data` не отображается в форме; автоматическое заполнение новых черновиков сохранено. Для повторной демонстрации с чистыми данными доступен полный reset через Prototype controls (удаляет текущие локальные изменения). Подписи не проставляются автоматически; после подписания доступны только новые группы через Supplemental Pickup. Фото используют общий mock-набор и не являются реальным evidence конкретной заявки.

Prototype controls (`#/more/demo`) содержит восемь отдельных сценариев: Normal Pickup, Multiple dimension groups, Offline + photo error, Printer unavailable, Damage + OTP, Locked Pickup + Supplemental, OTP Delivery, Draft conflict. 40/100 mock photos — в Optional photo volume checks. Пресеты переоткрывают сохранённые демо-черновики без потери правок. Для retry: Online → Retry → Sync now → Success → Retry sync. Для конфликта: Sync now → Keep local changes → Sync now. Offline моделирует состояние уже загруженного приложения, не запуск без сети. [Этап 3: реализация и проверки](../docs/system-report/STAGE_3_PHOTO_OFFLINE_DEMO.md).

## Документы BOL

В продуктовой модели различаются два независимых документа:

- `Order eBOL` относится к одному заказу и реализован от Pickup до итогового POD preview после Dropoff.
- `Interstate BOL` относится к одному Interstate Trip и его manifest. Этот сценарий уже представлен в текущем wireframe.
- `POD` — итоговое представление завершённого `Order eBOL` после Dropoff, а не отдельный Interstate-документ.

Order eBOL draft создаётся при продолжении из Pickup, обновляется до подписания и становится read-only после блокировки snapshot. Новые места после подписи создают Supplemental Pickup version; исходные evidence и confirmations не изменяются.
Текущий проект остаётся согласовательным бизнес-прототипом: подписи, блокировка данных, PDF и отправка будут представлены как mock-взаимодействия. Принятые решения, scope и открытые production-вопросы зафиксированы в [`BOL_DECISION_LOG.md`](../BOL_DECISION_LOG.md).

Все данные mock; изменения сохраняются только в `localStorage` браузера. Spoke, Telegram, камера, PDF и производственные API не подключены. Interstate использует нормализованные правила из аудита, но не вызывает существующий Apps Script. Наличие PostgreSQL DDL в репозитории не меняет эту границу: wireframe не подключён к БД.

## Этап 5: комментарии и документы

Pickup/Delivery review содержит отдельные Contact comment / Driver comment с автосохранением. Оба комментария видны перед подписью, в locked snapshot и POD; Supplemental хранит собственные комментарии. Отказ от подписи требует причины, acknowledgment и отдельного exception note.

Из Document versions доступны read-only original, Supplemental и Delivery с номером, PlaceID, signer, временем и комментариями. Download/Print/Email/Share открывают диалог с выбранным документом, параметрами/адресатом и результатом. Реальной внешней отправки или PDF-файла нет. Продуктовые подписи в UI сохранены; ограничения раскрываются устно и в документации. [Реализация и проверки](../docs/system-report/STAGE_5_EBOL_POD_DEMO.md).

Для подписывающего Pickup-контакта добавлен необязательный запрос email-копии конкретной версии eBOL: адрес подтверждается перед подписью водителя, а статус отправки виден в locked Pickup и Document versions. Offline-очередь, ошибка и повторная попытка показаны локально; фактической отправки нет. [Правила и проверки](../docs/system-report/PICKUP_EMAIL_COPY_WIREFRAME.md).

## Этап 6: данные заказа

Tasks → Order details показывает external/internal names, источник, отдельный Qty, Special Cargo и Spoke preview. Dispatcher редактирует имя и обработку; Supervisor заполняет отсутствующее имя один раз. Fragile/Oversized и mapping Supervisor → crew lead — demo-допущения. Данные и audit сохраняются локально.

В dimension groups неизвестные величины показаны пустыми, требуется причина перед review. Неполный объём исключён из известных итогов. Подписанные документы и reprint сохраняют имя/измерения своей версии; новые дополнения получают текущие данные. [Границы, сценарий и проверки](../docs/system-report/STAGE_6_ORDER_DATA_DEMO.md). Этап 7 включён в `main`; следующий бизнес-шаг — просмотр owner и фиксация решения по инструкции ниже.

## Этап 7: готовность к показу

[Инструкция ведущему и семь сценариев](../docs/system-report/STAGE_7_OWNER_DEMO_REHEARSAL.md). Чистый старт: `#/more/demo` → Reset all mock data → подтверждение удаления локальных данных → preset. Cancel сохраняет данные; повторное открытие preset без Reset продолжает сохранённую работу. Перед owner-показом скрыть служебную панель.

Исправлены смешивание заказов в Pickup/Dropoff, рассинхронизация номера в URL, переход locked Pickup → Dropoff, direct Back и сообщения пустого/несохранённого draft. Изменённый draft требует актуального review; unsigned Supplemental не попадает в Delivery, а ошибка сохранения документа не завершает Dropoff. Две репетиции 7/7 пройдены; это техническая готовность wireframe, не production и не подтверждение приёмки owner.

## Place labels

После Pickup маршрут `/orders/:orderNumber/labels` формирует отдельную Code 128 этикетку для каждого места. Place ID имеет формат `ZB-{ORDER_NUMBER}-{NN}`; повторная печать сохраняет те же идентификаторы. Interstate Loading и Unloading используют эти же IDs для фиксации полного, повторного или отсутствующего места.

Выберите labels → Print selected / Print all / Print this label → preview только выбранного набора → Print. Print all действует в рамках фильтра версии. Выбор и последние 20 mock-попыток сохраняются по заказу. В Prototype controls (`#/more/demo`) доступны Print success / Print error и Printer unavailable. При недоступном принтере можно продолжить review или проверить PlaceID вручную.

На labels остаётся одно основное действие Print; дополнительная кнопка browser print скрыта. Print history отражает локальные результаты сценария. Интеграция с конкретным принтером и камера телефона остаются вне scope. [Этап 4: реализация и проверки](../docs/system-report/STAGE_4_LABEL_PRINT_DEMO.md).
