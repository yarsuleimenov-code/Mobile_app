# Этап 5. Комментарии сторон и документы eBOL/POD

Дата: 2026-09-02. Статус: реализовано, проверено и принято owner; опубликовано с Этапом 6 в `main`, commit `8756a6f`.
Предыдущий baseline этапов 3–4: `1d2a2d2`. Текущий handoff — [CURRENT_STATE.md](CURRENT_STATE.md).

Изменение 2026-10-05: описание общего редактора на Review и просмотра обоих комментариев перед каждой подписью ниже — историческое. Актуально: [комментарий каждой стороны на её экране подписания](HANDOFF_COMMENTS_SIGNING_WIREFRAME.md); изменение реализовано и принято owner, push разрешён.

## Цель и результат

Водитель и контакт видят, какие данные и комментарии подтверждаются, а owner может пройти путь Pickup → Supplemental → Delivery → POD и показать отправку конкретного документа. Scope — Этап 5 [OWNER_DEMO_PLAN](OWNER_DEMO_PLAN.md), без реальных PDF/email/print services.

- В Pickup, Supplemental и Delivery review добавлены отдельные необязательные Contact comment / Driver comment. Сохраняются при вводе и восстанавливаются после reload; лимит поля — 1000 символов. Ошибка хранения показана явно, введённый текст остаётся в форме.
- При обновлении неподписанного evidence комментарии сохраняются. Комментарии нового Supplemental не копируются из original.
- Оба комментария показаны до каждой подписи, в locked review, отдельном документе и POD. Сохраняется именно подтверждённый текст; старые документы без полей показывают No comment recorded.
- Damage/disagreement отмечаются явно как исключение с отдельным описанием. Обычные комментарии не заменяют exception note. При выборе SMS code проверенный OTP заменяет подпись контакта; водитель подписывает явно.
- Insert signature переиспользован без нового signature storage. Вставка не завершает handoff: нужна отдельная кнопка подтверждения каждой версии. Повторная запись locked original/Delivery запрещена также в domain functions.
- Document versions открывает read-only original, каждое подписанное Supplemental и Delivery. Видны document number/type, точные PlaceID, показатели, фото, комментарии, способ подтверждения контакта, signer и время.
- POD остаётся итоговым представлением Order eBOL с отдельными handoff-секциями. Interstate BOL не смешивается с ними; дополнительный Interstate signature preview не требовался.

## Документы и действия

- Маршрут: `/orders/:orderNumber/ebol/documents/:documentKey`.
- Ключи: `pickup-1`, `pickup-2` и далее, `delivery`. Только подписанные snapshots; неизвестная/неподписанная версия даёт Document version unavailable без действий отправки.
- Отображаемые номера: `ORDER-PU-1`, существующий номер Supplemental `ORDER-PU-N`, `ORDER-DE-1`, итоговый `ORDER-POD`. Это UI-конвенция wireframe, не новый production numbering contract.
- Download PDF: имя выбранного документа → Download → Download complete.
- Print: количество копий 1–20 → Print document → результат. Printer unavailable блокирует только печать; управляемый Print error показывает Retry print.
- Email: контакт или водитель, адресат, сообщение → Send email → результат с адресатом и номером документа.
- Share: Email / Text message, адресат, сообщение → Share document → результат. Cancel/Close не отправляет и не изменяет snapshot.
- Используются зарезервированные `example.com` адреса и номера `555-01xx`. Реального файла PDF, письма, SMS, внешней ссылки или printer job не создаётся. HTML-документ уже доступен в preview; результаты моделируются локально.
- Управление результатом Print общее для labels и документов: служебный `#/more/demo`, Next print result. В рабочих экранах нет demo/prototype-пометок и ссылок на эту панель.

## Хранение и границы

В существующий `zaberman-order-ebols:v1` добавлено optional `handoff.comments = { contact, driver }`. Миграция и очистка пользовательских данных не нужны. Locked snapshots не переписываются для добавления новых полей; комментарии редактируются только у неподписанной целевой версии.

Автосохранение этой итерации относится к комментариям, не ко всем прежним полям review и не к нарисованной подписи. В незавершённом signing после перезагрузки нужен новый ввод подписи; уже подтверждённые версии не требуют повторного подписания. Результаты document actions не являются долговременным delivery/audit log. Серверная конкурентность, юридическая подпись и надёжная доставка остаются вне scope.

## Проверки

- `pnpm --dir wireframe test`: 17 файлов, 77 тестов. Новые 10 тестов покрывают optional comments, storage round-trip, refresh, отказ/исключение, отдельные Supplemental/Delivery comments, locked guards, версионную историю и legacy records.
- `pnpm --dir wireframe build`: TypeScript и Vite проходят.
- Chrome/Playwright, local production preview `http://127.0.0.1:4173/Mobile_app/`, ширины 320/390/1440 px. In-app Browser invocation failed: `node_repl kernel exited unexpectedly`, Windows sandbox setup refresh; использован ранее разрешённый fallback.
- Пройдено два последовательных сквозных прогона с отдельным чистым browser context: comments/reload → Pickup confirmations → Supplemental с собственными комментариями/PlaceID → Delivery exception gate → POD → Download/Print/Email/Share.
- Дополнительно: неизвестная версия, print error/unavailable, local-storage error/recovery. Действия документов не меняют original/supplemental/Delivery snapshots.
- Проверены page identity, непустой UI, отсутствие framework overlay, ошибок приложения и горизонтального переполнения; просмотрены мобильные и desktop screenshots.
- Регрессия Этапа 4: selected labels, reload, print/reprint/error/unavailable, Code 128 print media и manual Scan проходит.
- Реальное оборудование, PDF-файл, юридические свойства подписей и внешняя отправка не проверялись и не реализовывались.

Последующий [Этап 6: данные заказа](STAGE_6_ORDER_DATA_DEMO.md) реализован отдельно. Следующий — Этап 7, репетиция owner-demo. Проверки выше относятся к исходному срезу Этапа 5.
