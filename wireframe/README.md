# Zaberman mobile wireframe

Интерактивный mobile-first прототип фиксации груза менеджерами Pickup/Dropoff. Маршрут на день остаётся в Spoke и не дублируется в Zaberman.

Публичный прототип: https://yarsuleimenov-code.github.io/Mobile_app/

Актуальная граница реализации и следующий рекомендуемый этап: [`docs/system-report/CURRENT_STATE.md`](../docs/system-report/CURRENT_STATE.md).

## Запуск

```powershell
pnpm install
pnpm dev
```

Открыть `http://127.0.0.1:5173/`. Production-проверка: `pnpm build`.

Проверено 2026-09-02: 14 test-файлов / 40 тестов, TypeScript project build и Vite production build проходят. Локальная production-сборка проверена в Chrome через Playwright на ширинах 320, 390 и 1440 px.

## Что оценивать

- Home: быстрый выбор операции, Today’s stops, контекстная навигация `Order documents` и последние операции.
- Pickup: автосохраняемый draft, восстановление после перезапуска, dimension groups (Qty, L/W/H, вес одного места), add/edit/delete, change history, автоматические итоги и фотографии. Отдельные PlaceID сохраняются внутри групп.
- Locked Pickup: исходная версия read-only; новые места оформляются через Supplemental Pickup, новую document version и новые mock-подписи.
- Dropoff: поиск заказа, сравнение Pickup evidence, Delivery-фотографии и фиксация damage/exception без блокировки передачи.
- Нижнее меню: `Home | Tasks | Scan | More`; Pickup и Dropoff открываются из Home/Tasks, Interstate — из More.
- More → Prototype controls (`DEV ONLY`): роль/филиал, online/offline/slow, результат следующей синхронизации, доступность camera/scanner/printer и полный сброс mock-данных.
- More → Cargo places: стабильный `PlaceID`, Order и `n/N`, размеры/источник веса, label, current location/status и короткая event history для каждого места.
- Interstate: выбор направления и truck, загрузка конкретных мест, review manifest, создание Trip и `Interstate BOL`.
- Interstate BOL archive: поиск текущих и закрытых Trip-документов по номеру, TripID, направлению или truck.
- Контрольный пример: заказ `#11155599`, итоговый объём `273.44 cu ft`.

## Демо для owner

Home → Load today’s route → Pickup: заявки `23343775`, `23343778`, `23343780`, `23343782` открываются с mock-размерами, количеством, весом, упаковкой, ответственным, комментарием и тремя демонстрационными фото. Dropoff-заявки маршрута уже связаны с существующими Cargo records.

Пример `23343775`: 3 стула × 24 × 24 × 36 in, 18 lb/place → 54 lb и 36.00 cu ft. Изменение Qty на 4 → 72 lb и 48.00 cu ft. Новые planned Pickup не становятся выполненными от одного открытия формы.

Сохранённые правки имеют приоритет перед шаблоном. Для старого пустого черновика используйте `Load demo data` и подтвердите замену либо выполните полный reset через Prototype controls. Подписи не проставляются автоматически; после подписания доступны только новые группы через Supplemental Pickup. Фото используют общий mock-набор и не являются реальным evidence конкретной заявки.

## Документы BOL

В продуктовой модели различаются два независимых документа:

- `Order eBOL` относится к одному заказу и реализован от Pickup до итогового POD preview после Dropoff.
- `Interstate BOL` относится к одному Interstate Trip и его manifest. Этот сценарий уже представлен в текущем wireframe.
- `POD` — итоговое представление завершённого `Order eBOL` после Dropoff, а не отдельный Interstate-документ.

Order eBOL draft создаётся при продолжении из Pickup, обновляется до подписания и становится read-only после блокировки snapshot. Новые места после подписи создают Supplemental Pickup version; исходные evidence и confirmations не изменяются.
Текущий проект остаётся согласовательным бизнес-прототипом: подписи, блокировка данных, PDF и отправка будут представлены как mock-взаимодействия. Принятые решения, scope и открытые production-вопросы зафиксированы в [`BOL_DECISION_LOG.md`](../BOL_DECISION_LOG.md).

Все данные mock; изменения сохраняются только в `localStorage` браузера. Spoke, Telegram, камера, PDF и производственные API не подключены. Interstate использует нормализованные правила из аудита, но не вызывает существующий Apps Script. Наличие PostgreSQL DDL в репозитории не меняет эту границу: wireframe не подключён к БД.

## Place labels

После Pickup маршрут `/orders/:orderNumber/labels` формирует отдельную Code 128 этикетку для каждого места. Place ID имеет формат `ZB-{ORDER_NUMBER}-{NN}`; повторная печать сохраняет те же идентификаторы. Interstate Loading и Unloading используют эти же IDs для фиксации полного, повторного или отсутствующего места.

Печать выполняется через браузер. Интеграция с конкретным принтером и камера телефона остаются вне scope согласовательного прототипа.
