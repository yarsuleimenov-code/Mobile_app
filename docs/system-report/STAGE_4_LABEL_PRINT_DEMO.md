# Этап 4. Labels и выборочная mock-печать

Дата: 2026-09-02. Статус: реализовано и проверено локально, готово к приёмке owner. Commit/push не выполнялись.

Scope — Этап 4 [принятого OWNER_DEMO_PLAN](OWNER_DEMO_PLAN.md). Реальные принтеры и аппаратный scan не подключаются.

## Результат

- Экран labels: выбор нескольких мест, Clear selection, `Print selected (N)`, `Print all (N)` и `Print this label`. При нулевом выборе selected action недоступен.
- Эти действия открывают preview, а не отправляют задание на оборудование. Preview содержит только выбранные этикетки с Order, PlaceID, исходным n/N, dimension group и Pickup version. Существующий Code 128 сохранён.
- `Print all` относится ко всем labels текущего фильтра. Фильтры: All places, Original Pickup, отдельные Supplemental versions. При смене фильтра выбор очищается, чтобы не печатать скрытые labels.
- Вход из Supplemental Pickup открывает свою версию и предлагает только новые места. Original snapshot, состав заказа и PlaceID печатью/перепечатью не меняются.
- `Print` показывает Print successful / Print failed; Print success / Print error выбираются в служебной панели `#/more/demo` независимо от sync outcome. История называется Print history. По решению owner demo-пометки и ссылки на служебную панель убраны с обычных экранов.
- История последних 20 mock-попыток хранит время, точные IDs, версии, результат и число повторных labels. Retry после первой неудачи не считается успешной предыдущей печатью. Reprint/Retry batch открывает preview соответствующего набора.
- Если место удалено из текущего заказа, повтор из истории не восстанавливает его. Показывается число ещё доступных labels.
- Printer unavailable не мешает preview, review и ручному вводу PlaceID. Выбор и история восстанавливаются после возврата/reload. Ошибка локального сохранения показывается отдельно.
- Дополнительная кнопка browser print убрана с labels: основное действие — Print с локальным результатом. Print CSS для выбранного preview сохранён; системная печать браузера не учитывается в истории.

## Scan

Исправлена прежняя заглушка, которая на любой непустой ввод показывала `ZB-11155599-02`.

- Используется существующая проекция Cargo places, включая текущее Interstate location/status.
- Точный PlaceID → фактически найденное место и Open place.
- Повтор того же PlaceID в текущем посещении Scan → Already scanned this visit; место не добавляется и не перемещается.
- Неизвестный/частичный код → Code not found, без ложной карточки места.
- Точный OrderID → список мест этого заказа с фильтром.
- На labels доступен переход в Scan с заполненным PlaceID. Manual Find работает при недоступных camera/scanner; Scan label / Repeat last scan показывают valid/duplicate без оборудования. Неизвестный код проверяется через ручной ввод; отдельная кнопка его симуляции убрана.

## Правило презентации и повторная проверка

Уточнение owner от 2026-09-02 применено к активным экранам labels, Scan, More, фото/sync, Pickup/Delivery signing, POD и Interstate BOL. UI использует продуктовые подписи; ограничения имитаций раскрываются устно и в документации. Быстрая вставка подписи называется Insert signature и по-прежнему требует отдельного подтверждения. POD actions пока показывают уведомление о готовности документа, не создают файл или отправку; полноценный интерактивный результат остаётся в Этапе 5.

Повторно прошли 67 тестов, сборка, браузерный путь labels/print/reprint/error/unavailable/manual lookup и Pickup → Supplemental → Delivery → POD. Проверены отсутствие demo/mock/prototype/simulate в тексте рабочих экранов, отсутствие ссылок на служебную панель, photo preview, POD actions, 320/390/1440 px и отсутствие ошибок приложения. In-app Browser не запустился (`node_repl kernel exited unexpectedly`, sandbox setup refresh); использован ранее разрешённый Chrome/Playwright. Реальные устройства и внешние интеграции не тестировались.

## Хранение и границы

- `zaberman-label-print:v1:<order>`: scope, selectedIds, до 20 mock-попыток. Заказы изолированы; пустой выбор сохраняется.
- Фильтр версии отражается в URL, поэтому reload после его изменения восстанавливает последний выбор, а не прежний Supplemental-фильтр.
- Старые scenario settings совместимы: printOutcome по умолчанию success.
- Счётчики/preview вычисляются из выбранных ID, копия Cargo records для печати не создаётся. Новых зависимостей нет.
- История ограничена 20 попытками, распознавание reprint — в пределах этой истории. Scan repeats относятся к текущему посещению экрана. Это UX-демо, не production audit или гарантия идемпотентности hardware jobs.
- Reset all mock data удаляет также сохранённый выбор/историю, с существующим подтверждением. Нет pairing, printer SDK, Bluetooth, калибровки или проверки физической читаемости штрихкодов.

## Проверка

- `pnpm test`: 16 файлов, 67 тестов, включая 12 новых проверок выбора, истории, версий, восстановления и Scan.
- `pnpm build`: TypeScript и Vite production build проходят.
- Chrome/Playwright: local production preview `http://127.0.0.1:4173/Mobile_app/`, ширины 320/390/1440 px; отдельные тестовые данные.
- Пройдено: выбрать 2 → reload → preview только этих 2 → mock success → перепечатать 1 → print error → reload → printer unavailable → manual Scan → success/retry. Clear selection, Print all и история batch reprint проверены.
- Print media содержит только выбранные labels; UI управления и история скрыты. Реальная печать не запускалась.
- Пройдено: original Pickup signing → Supplemental из двух мест → labels только новой версии → смена версии/reload → original labels → reprint из истории. Original snapshot остаётся неизменным.
- Пройдено: valid, duplicate, unknown, ручной произвольный известный PlaceID, OrderID и manual fallback при unavailable camera/scanner. Нет новых мест от lookup.
- Проверены page identity, непустой экран, отсутствие framework overlay/ошибок приложения, screenshots и отсутствие горизонтального переполнения. Необязательный favicon по-прежнему может вернуть 404.
- In-app Browser: invocation failed (`trusted Node process exited unexpectedly`); использован ранее разрешённый Chrome fallback. Физическая печать/реальные сканеры не тестировались.
- Регрессия Этапа 3: Pickup → Supplemental → Delivery → POD, photos/restore и demo presets проходит.

Следующий этап — **5. eBOL/POD: комментарии сторон и представление документа**. Его реализация в этот этап не входит.
