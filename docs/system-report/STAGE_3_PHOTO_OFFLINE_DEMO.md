# Этап 3. Mock-фото и offline-состояния

Дата: 2026-09-02. Статус: реализовано и проверено локально; результат принят owner перед переходом к Этапу 4. Не опубликовано.

Scope этой итерации — [принятый OWNER_DEMO_PLAN](OWNER_DEMO_PLAN.md), только Этап 3. Дальнейшие этапы выполняются отдельно.

## Результат для демонстрации

- Pickup и Delivery содержат отдельные mock-фото со стабильным ID, Order, handoff, категорией и ссылкой на один из четырёх существующих примеров.
- `Take photo` и `Choose from gallery` добавляют примеры, без обращения к устройствам/файлам. При Camera unavailable галерея остаётся доступной.
- Категории: Before pickup, After delivery, Packaging, Condition, Damage. Доступны фильтр с количеством, preview выбранного фото и удаление только этого фото до подписи.
- Pickup draft, Delivery photos/checks и очередь сохраняются в браузере. `Saved on device`, Pending, Syncing, Synced, Retry needed и Needs review визуально разделены.
- Retry использует те же фото/операции. Поздний результат sync не подтверждает более новую правку и не возвращает удалённые фото. Прерванный reload sync восстанавливается как pending.
- Единственный конфликт — локальные правки против более раннего demo-комментария другого устройства. `Keep local changes` явно выбирает локальные данные, затем `Sync now` завершает имитацию. Автоматического merge или перезаписи signed evidence нет.
- Review и POD показывают фото соответствующего snapshot; Supplemental Pickup хранит только новые фото и имеет отдельный read-only просмотр. Повторное сохранение/удаление фото незавершённого дополнения не дублирует и не возвращает удалённые фото.
- Общий pending-индикатор учитывает очередь evidence и прежние ожидающие изменения Pickup/Dropoff. Управление сценариями остаётся в служебной панели `#/more/demo`; `Load demo data` в Pickup не возвращён.

После уточнения owner от 2026-09-02 demo-пометки и переходы к служебной панели скрыты в рабочих экранах; моделирование и хранение не изменены.

## Воспроизводимые пресеты

| Кнопка в Prototype controls | Order | Состояние |
|---|---|---|
| Normal Pickup | 99003001 | Online + Success, 3 фото |
| Offline + photo error | 99003002 | Offline; после выбора Online следующий sync даёт Retry |
| Draft conflict | 99003003 | Online; Sync now показывает Needs review |
| 40 mock photos | 99003040 | 40 ссылок на повторяемые assets |
| 100 mock photos | 99003100 | 100 ссылок; сначала видны 12, далее Show more |

Пресет не уничтожает ранее сделанные правки: черновик переоткрывается, подписанный заказ открывается read-only. Для чистого повторного показа — существующий Reset all mock data с подтверждением; он удаляет локальные `zaberman-*` данные. Новых зависимостей нет.

## Локальное хранение и границы

- `zaberman-pickup-drafts:v1`: добавлены photos и basePhotoIds; count-only старые черновики читаются совместимо.
- `zaberman-delivery-draft:v1:<order>`: photos и результаты визуальной проверки Delivery.
- `zaberman-evidence-queue:v1`: operation/photo ID, версия локальной правки и статус имитации.
- Cargo records / Order eBOL: metadata фотографий в соответствующих версиях. Статусы передачи хранятся отдельно от подписанного evidence.
- Сохранены компактные dimension groups и индивидуальные PlaceID. Фото не привязаны к конкретной группе: для принятого сценария достаточно Order + handoff/version.
- Ошибка записи draft/queue отображается пользователю. Очистка браузерного хранилища уничтожает локальные изменения; это не durable offline-first продукт.
- Offline относится к уже загруженному прототипу. Нет PWA, cold-start без сети, фонового sync, камеры, файлов, upload, API, реального второго устройства или серверного подтверждения. 100 фото — проверка выдачи метаданных, не нагрузочный тест media.

## Проверка

- `pnpm test`: 15 файлов, 55 тестов; добавлены 15 проверок фото/очереди, legacy-совместимости, восстановления, retry/conflict, изоляции операций и неизменности snapshots.
- `pnpm build`: TypeScript + Vite production build.
- Локальный production preview: `http://127.0.0.1:4173/Mobile_app/`; Chrome/Playwright, изолированные данные, ширины 320/390/1440 px.
- Пройдено: фото двух категорий → preview/remove/filter → Offline + edit → reload → Online + Retry → reload ошибки → Success без дублей → Conflict → reload → Keep local changes → Sync.
- Пройдено: Pickup signing → отдельные фото и новые подписи Supplemental → Delivery photos/checks + reload → Delivery signing → POD с тремя отдельными разделами evidence. Locked Delivery не даёт редактировать фото.
- Проверены normal/offline/conflict/100-photo presets, компактная выдача, camera unavailable → gallery fallback. Нет горизонтального переполнения; dimension groups остаются в один ряд.
- Page identity, непустой экран, отсутствие framework overlay и app console errors проверены. Сохраняется необязательный 404 favicon. Встроенный Browser не стартует из-за Windows sandbox `setup refresh had errors`; использован ранее разрешённый Chrome fallback.

Результат принят owner. Следующий по плану [Этап 4 — Labels и выборочная печать](STAGE_4_LABEL_PRINT_DEMO.md) выполнен отдельной итерацией.
