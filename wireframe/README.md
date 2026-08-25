# Zaberman mobile wireframe

Интерактивный mobile-first прототип фиксации груза менеджерами Pickup/Dropoff. Маршрут на день остаётся в Spoke и не дублируется в Zaberman.

Публичный прототип: https://yarsuleimenov-code.github.io/Mobile_app/

## Запуск

```powershell
pnpm install
pnpm dev
```

Открыть `http://127.0.0.1:5173/`. Production-проверка: `pnpm build`.

## Что оценивать

- Home: быстрый выбор операции, Today’s stops, контекстная навигация `Order documents` и последние операции.
- Pickup: номер заказа, дата, ответственный, упаковка, комментарий, вес, группы одинаковых мест, автоматический объём и общие фотографии груза.
- Dropoff: поиск заказа, сравнение Pickup evidence, Delivery-фотографии и фиксация damage/exception без блокировки передачи.
- Нижнее меню: `Home | Pickup | Dropoff | Interstate`.
- Interstate: выбор направления и truck, загрузка конкретных мест, review manifest, создание Trip и `Interstate BOL`.
- Interstate BOL archive: поиск текущих и закрытых Trip-документов по номеру, TripID, направлению или truck.
- Контрольный пример: заказ `#11155599`, итоговый объём `273.44 cu ft`.

## Документы BOL

В продуктовой модели различаются два независимых документа:

- `Order eBOL` относится к одному заказу и реализован от Pickup до итогового POD preview после Dropoff.
- `Interstate BOL` относится к одному Interstate Trip и его manifest. Этот сценарий уже представлен в текущем wireframe.
- `POD` — итоговое представление завершённого `Order eBOL` после Dropoff, а не отдельный Interstate-документ.

Order eBOL draft создаётся при `Save Pickup`, обновляется до подписания и становится read-only после блокировки Pickup snapshot.
Текущий проект остаётся согласовательным бизнес-прототипом: подписи, блокировка данных, PDF и отправка будут представлены как mock-взаимодействия. Принятые решения, scope и открытые production-вопросы зафиксированы в [`BOL_DECISION_LOG.md`](../BOL_DECISION_LOG.md).

Все данные mock; изменения сохраняются только в `localStorage` браузера. Spoke, Telegram, камера, PDF и производственные API не подключены. Interstate использует нормализованные правила из аудита, но не вызывает существующий Apps Script.

## Place labels

После Pickup маршрут `/orders/:orderNumber/labels` формирует отдельную Code 128 этикетку для каждого места. Place ID имеет формат `ZB-{ORDER_NUMBER}-{NN}`; повторная печать сохраняет те же идентификаторы. Interstate Loading и Unloading используют эти же IDs для фиксации полного, повторного или отсутствующего места.

Печать выполняется через браузер. Интеграция с конкретным принтером и камера телефона остаются вне scope согласовательного прототипа.
