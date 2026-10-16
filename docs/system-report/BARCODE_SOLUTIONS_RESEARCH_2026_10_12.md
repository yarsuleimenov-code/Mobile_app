# Исследование решений для штрихкодирования грузовых мест Zaberman

> **Research snapshot.** Исследование от 2026-10-12, не утверждённое решение о QR, SaaS, оборудовании или стеке Mobile App. При синхронизации 2026-10-16 внешние источники/цены не перепроверялись. Актуальный Mobile App scope: [PROJECT_BASELINE](../PROJECT_BASELINE.md).

Дата проверки публичных источников: **12 октября 2026 года**. Получатели: owner, Operations и команда мобильного приложения. Решение, которое должен поддержать отчет: выбор готового продукта и оборудования для небольшого пилота, с сохранением пути к собственному приложению.

## 1. Executive Summary

**Рекомендуется начать с Orca Scan на Android, без интеграции с действующими системами, с отдельной записью на каждое физическое место.** Это наиболее подходящий кандидат для проверки маркировки и цепочки перемещений: настраиваемые поля, генерация кодов, мобильное сканирование, история и выгрузка данных. Для четырех участников Starter стоит **$79/месяц** с дополнительными пользователями; Business — **$99/месяц** с пятью пользователями и API/Webhooks. Для короткого пилота без интеграции достаточно Starter. [Тарифы Orca Scan](https://orcascan.com/pricing).

**Полное соответствие ТЗ у готовых решений не установлено.** Особые пробелы: строгая сверка каждого места с Trip Manifest, защита от повторной операции, immutable evidence, создание и печать новых мест offline. Пилот должен проверить эти ограничения, а не объявлять inventory SaaS готовой заменой Zaberman.

**Оборудование: мобильный термопринтер класса Brother RuggedJet 4 с аккумулятором.** Для Orca опубликована связка Android → Brother Print Service Plugin → Bluetooth → RJ-4250WB; iOS-инструкция использует Wi‑Fi. RJ-4250WB снят с производства. Для новой закупки предпочтителен актуальный RJ-4255WB-L, но его работу именно с Orca следует сначала подтвердить на демонстрационном устройстве. [Инструкция Orca](https://orcascan.com/guides/brother-rj4250wb-orca-scan-setup-aa650889), [статус RJ-4250WB](https://brothermobilesolutions.com/products/printers/ruggedjet/ruggedjet-4/rj4250wb/), [актуальная линейка](https://brothermobilesolutions.com/products/printers/ruggedjet/ruggedjet-4/).

**Top 3 для проверки:** Orca Scan; BoxHero как более дешевый вариант складского учета; Sortly как вариант визуального учета с фото. Второй и третий кандидаты имеют более существенные ограничения для полевого Bluetooth-процесса. Для Stage 2 рекомендуется собственный учет CargoPlace и событий Zaberman, локальная генерация QR и hardware SDK Brother либо Zebra. Покупка специализированного barcode SaaS для этой архитектуры не обязательна.

Рекомендуемый основной формат — **QR**, с opaque PlaceID и версией payload. Это предложение по символогии, а не изменение принятой модели: в baseline уже установлен UUIDv7, а текущий wireframe показывает Code 128. При переходе сохранить ранее выданные коды через таблицу соответствий; не переклеивать все места только из-за смены системы.

## 2. Требования из ТЗ и согласованных решений

### Источники и границы

Изучены локальное [ТЗ мобильного приложения](../../ТЗ%20мобильного%20приложения.docx), [Stage 0 Product Decisions](STAGE_0_PRODUCT_DECISIONS.md), [Scan and Cargo](../../knowledge-base/mobile-app/scan-and-cargo.md), [Interstate and BOL](../../knowledge-base/mobile-app/interstate-and-bol.md), [Open Questions](../mobile-app/open-questions.md).

В предоставленной [Google-таблице «анализ штрихкодирование»](https://docs.google.com/spreadsheets/d/1Kajz5iLgFwKFB8Nbaw4yQa10wJ9Gde-zD3svpEd3kTI/edit) обнаружен один лист «Лист1»; диапазон A1:K30 возвращает пустые значения. Поэтому таблица не использована как ТЗ. Это проверка указанного диапазона, а не утверждение об отсутствии данных за его пределами.

Пользователи: водитель/delivery crew, складской сотрудник, supervisor; dispatcher/admin поддерживает подготовку и сверку. Основной вопрос: можно ли быстро маркировать каждое место и надежно найти его историю на всех handoff без собственной разработки?

Минимальный готовый результат исследования: shortlist, проверенные пути печати, условия тарифов, границы API, рекомендация и исполнимый план пилота. Реальные регистрации, покупки, интеграции и полевые тесты в scope исследования не входят. Код мобильного приложения не изменяется.

### Обязательные бизнес-правила

| Требование | Следствие для выбора |
|---|---|
| Order, OrderItem, CargoPlace и количество единиц — разные сущности | Один SKU с Qty=10 не заменяет десять PlaceID |
| Каждый физический CargoPlace имеет отдельный идентификатор | В inventory SaaS одна карточка/строка на место, учетное количество места = 1 |
| OrderID, номер места, размеры, вес/quality state, фото, статус, Location и TripID | Нужны пользовательские поля; содержимое места хранится отдельно от количества мест |
| Pickup и Dropoff независимы | Нельзя считать их одним изменением остатка или одной закрытой задачей |
| Loading сверяется с ожидаемым Trip Manifest | Поиск карточки по коду недостаточен; требуется проверка допустимости в выбранном Trip |
| Unloading сверяется с фактически загруженным составом | Плановый список и факт загрузки должны сохраняться отдельно |
| Scan lookup не изменяет состояние груза | Операция должна явно выбираться/подтверждаться пользователем |
| История содержит время, actor и device | Последний статус без событий не обеспечивает chain of custody |
| Критические операции доступны offline | Нужно проверить доступ к чужим ранее созданным местам, новые ID, печать, события и sync |
| Повторная отправка не создает дубль операции | Нужны event identity и идемпотентность, а не только уникальный barcode |
| Reprint сохраняет PlaceID; replacement сохраняет связь и историю | Печать копии и замена активного label alias — разные операции |
| Подписанные факты не переписываются | Обычный редактируемый inventory history не заменяет correction/reversal и locked snapshot |

Принятый baseline: **primary PlaceID — immutable UUIDv7; payload — schema version + opaque PlaceID; label — Order number, n/N и короткий alias**. Order/Dispatch master остается владельцем плановых заданий; Zaberman operational DB — владельцем фактов; BOL/POD — отдельный документный модуль. Эти правила не меняются ради SaaS. Источник: разделы 7–10 [Stage 0](STAGE_0_PRODUCT_DECISIONS.md).

## 3. Обзор рынка и критерии отбора

Рассмотрены семь кандидатов из четырех классов: barcode capture, inventory/asset tracking, WMS/ERP и delivery SaaS. Не установлено ни одного продукта, одновременно подтверждающего весь сценарий Zaberman, offline-first и мобильную Bluetooth-печать на обеих платформах as-is.

| Класс | Что закрывает | Где возникает разрыв |
|---|---|---|
| Barcode capture — Orca Scan | Быстрая настройка формы, идентификация, фиксирование операции | Нет доказанного штатного Trip Manifest и строгого lifecycle Zaberman |
| Inventory/asset — BoxHero, Sortly, Scanlily, Mobile Inventory | Карточки, местонахождение, фото/атрибуты, история учета | Учет SKU/остатков приходится адаптировать к отдельным грузовым местам |
| WMS/ERP — Odoo Inventory + Barcode | Физические packages, warehouse transfers, складская сверка | Более тяжелое внедрение; Interstate Trip и документы Zaberman не штатные сущности |
| Delivery — Onfleet | Pickup/Dropoff, сканирование каждого piece, контроль завершения task | Цена и изменение dispatch-процесса; Warehouse/Interstate не подтверждены |

Отдельные label management системы, например Loftware NiceLabel, полезны для централизованного управления печатью, но не заменяют реестр CargoPlace и историю операций. Для одного пилотного принтера добавление такого слоя не оправдано. Это оценка применимости; официальные примеры описывают cloud/web printing и интеграционные print jobs. [Loftware о печати](https://www.loftware.com/siteassets/partner-pages/doc/partner-program/local/en_us/loftware_alliance-partner-programs-guide.pdf).

Приоритет отбора: уникальность физического места → полевой print/scan → история → multi-user/offline → экспорт → API. Наличие routing, purchasing или AI inventory само по себе не повышает пригодность.

## 4. Shortlist и применимость as-is

### Orca Scan — основной кандидат

Barcode-платформа с настраиваемыми формами. Mobile app позволяет добавить item, сканировать, заполнить поля и сохранить; web настраивает пользователей и шаблоны. Для быстрых повторных операций предусмотрены continuous scan и закрепление значений. Применимость: запись = CargoPlace; OrderID/TripID/Location/Operation — поля, а не новые бизнес-сущности. [Mobile guide](https://orcascan.com/guides/orca-scan-mobile-app-76ecf6ed).

Автоматические значения поддерживаются, включая Unique ID с prefix/suffix/length; можно импортировать собственные barcode values. Это **не подтверждение UUIDv7** и не доказательство безопасной генерации на двух offline-устройствах. [Генерация кодов](https://orcascan.com/guides/generate-barcodes-1eefe298).

История фиксирует действие, timestamp, user и device. На практике следует проверить повторное чтение без изменения полей, экспорт всей истории и сохранение исходного времени offline-события. [History log](https://orcascan.com/guides/history-log-b7585004).

Ограничение: unknown scan может приводить к добавлению записи при соответствующих правах. Нельзя разрешать warehouse/loading employee создавать «новое место» вместо разбора неизвестного кода. Field-level и operation-level ограничения Zaberman штатными sheet permissions не доказаны.

### BoxHero — бюджетная складская альтернатива

Генерирует barcode при регистрации item; поддерживает QR и операции Stock In/Out/Move. Для пилота каждый CargoPlace придется оформить отдельным item с Qty=1, OrderID — атрибутом. [Barcode printing](https://www.boxhero.io/docs/key-features/print-barcode), [barcoding](https://www.boxhero.io/features/barcoding).

Конкретная официальная инструкция подтверждает **Android → Zebra Print → Bluetooth → ZD421T**. Это печать через сервис производителя и настольный принтер; переносить вывод на мобильный ZQ521 или iOS нельзя. Для ZD230D инструкция описывает LAN/Wi‑Fi. Общая страница содержит противоречие: перечисляет Bluetooth, затем требует одну Wi‑Fi-сеть. Для ZD421T приоритет отдан модельной инструкции. [ZD421T](https://www.boxhero.io/docs/resources/guides/zebra-zd421t/mobile-printing), [ZD230D](https://www.boxhero.io/docs/resources/guides/zebra-zd230d/mobile-printing).

Offline заявлен на feature page, но полного контракта создания/печати/конфликтов нет. Подходит для складского теста; для Pickup с автономным принтером — условный кандидат.

### Sortly — альтернатива с визуальным учетом

Создает собственные QR/barcode labels, использует фото и карточки предметов. В тарифах Advanced — QR, Ultra и выше — QR и Barcode. Одна карточка должна соответствовать одному месту. [Выбор этикеток](https://help.sortly.com/choosing-the-right-labels-in-sortly).

Печать формирует label/PDF; на iOS подтвержден только AirPrint. Это не native Bluetooth-печать. На Android вывод зависит от доступного print service, поэтому нужен тест конкретного принтера. [Create labels](https://help.sortly.com/hc/en-us/articles/360037385792-Create-QR-Code-and-Barcode-Labels).

Offline доступен в Android/iOS mobile app, с предварительной синхронизацией. Документация описывает Disable Sync и последующее включение синхронизации; автоматический надежный conflict resolution не подтвержден. [Offline guide](https://help.sortly.com/can-i-use-sortly-in-offline-mode).

### Mobile Inventory — недорогой Android-first тест

Поддерживает inventories/products/transactions, custom fields, сканирование и team sync на PRO; offline доступен. Для shared Android inventory требуется разрешение Allow changes while offline. Это не подтверждает одинаковые offline writes на iOS. [Функции](https://support.mobileinventory.net/articles/free-vs-premium-vs-sync/), [multi-user](https://support.mobileinventory.net/articles/multiple-user-synchronization/).

Генератор печати web умеет создать значения, Code 128/QR и экспорт PDF/SVG/PNG; workflow проходит через браузерную печать. Подтвержденного модельного Bluetooth-пути и публичного developer API с endpoints не найдено. Наличие слова API в terms не считается доказательством доступной интеграции. [Print Barcodes](https://support.mobileinventory.net/articles/print-barcodes/).

Подходит для контролируемого учета мест и операций; неудобен как долгосрочная интеграционная основа до подтверждения API и печати.

### Scanlily — учет коробок и содержимого, условный кандидат

Есть items/containers, QR lookup, собственные barcode values и history. Современная pricing page дает генерацию labels на Pro, multi-user/locations на Ultra и API на Premium; старые help pages используют тариф Business. Следует проверять функцию в выбранном аккаунте, а не покупать по старому названию тарифа. [Pricing](https://www.scanlily.com/en/pricing), [QR и barcodes](https://www.scanlily.com/en/features/QR_Codes_and_Barcodes).

Web label generator создает уникальные Scanlily QR и PDF, в том числе 4×6 inches. Это не доказательство встроенной Bluetooth-печати и локальной генерации новых labels offline. Proprietary barcode допускает совпадения с последующим выбором item — для Zaberman это нежелательно. [Генератор labels](https://www.scanlily.com/en/features/generate_qr_and_barcode_labels).

Описанный offline-first photo workflow означает съемку штатной камерой с поздней загрузкой; полноценные offline scan/status events не подтверждены. [Web upload](https://www.scanlily.com/en/blog/upload_images_and_videos_via_web). **Не подходит для полного пилота с обязательными offline и Bluetooth без дополнительной проверки.**

### Odoo Inventory + Barcode — складской кандидат, не быстрый полевой пилот

Packages обозначают физические контейнеры и имеют отдельные barcode; Packaging обозначает тип упаковки/число товаров. Для CargoPlace применимы именно **Packages**. Receipts/deliveries/transfers обрабатываются Barcode app. [Packages vs Packaging](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/product_management/configure.html), [складские операции](https://www.odoo.com/documentation/master/applications/inventory_and_mrp/barcode/operations/receipts_deliveries.html).

Есть package barcode labels и ZPL/PDF. В документации master описана прямая сетевая печать ePOS/ZPL/IoT; это не Bluetooth со смартфона. Возможности master могут отличаться от установленной 19.0, поэтому не считаются обещанием текущего SaaS. [Zebra labels 18.0](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/shipping_receiving/setup_configuration/zebra.html), [printing master](https://www.odoo.com/documentation/master/applications/inventory_and_mrp/inventory/shipping_receiving/setup_configuration/print_on_validation.html).

Базовый offline-first barcode workflow не подтвержден. Для Stage 1 непропорционален задаче, если Zaberman отдельно не выбирает ERP/WMS.

### Onfleet — готовые handoff, более дорогой и широкий scope

Courier Suite генерирует отдельный QR для каждого piece заказа; при Required правильный barcode нужен для завершения task. Есть история сканирований Pickup/Dropoff и Route Load task для проверки пакетов перед доставкой. **Route Load не равен Interstate Trip**: разгрузка в destination warehouse и отдельный Interstate BOL не установлены. [Courier barcode](https://support.onfleet.com/hc/en-us/articles/37852822362132-Barcode-Scanning-Couriers-and-Clients), [Route Load](https://support.onfleet.com/hc/en-us/articles/47768817655956-Route-Load-Task).

Печать labels — из dashboard через browser, формат 4×6, с драйвером/ПО принтера; полевой Bluetooth print внутри driver app не подтвержден. [Label printing](https://support.onfleet.com/hc/en-us/articles/28839217171220-Label-Printing).

Offline mode включается в driver settings; без него старт/завершение task ограничены connectivity. Поведение новых barcode labels offline не установлено. [Driver settings](https://support.onfleet.com/hc/en-us/articles/10228814951060-Driver-App-Settings). Подходит для отдельного last-mile пилота, особенно если Onfleet уже используется, но не рекомендуется покупать его только ради маркировки.

## 5. Сравнительная таблица и стоимость Stage 1

### Покрытие пяти операций и зависимость от поставщика

Матрица — оценка применимости опубликованных функций из раздела 4, а не проверка в работающих аккаунтах. «Ручная адаптация» означает сохранение исходных Order/Operation/Trip сущностей через поля и сверку, без объявления нового inventory-процесса процессом Zaberman.

| Продукт | Pickup создание и label | Warehouse receiving | Interstate loading | Interstate unloading | Dropoff | Vendor lock-in и выход |
|---|---|---|---|---|---|---|
| Orca | Mobile Add/print; авто-ID на mobile/offline проверить | Scan + operation/location; сверка вручную | TripID field + ручной Manifest | Location/event + ручная сверка loaded set | Scan + операция; комплект вручную | Средний: поля переносимы, history export проверить; сохранить собственный payload/mapping |
| BoxHero | Item/Generate/print; мобильный printer условно | Stock In на item=place | Move + TripID attribute; native Trip нет | Move в warehouse; expected set вручную | Stock Out; комплект вручную | Средний: перенос карточек/API доступен, stock transaction semantics надо преобразовать |
| Sortly | Item/photo/label PDF, Android printer проверить | Move/edit после scan | TripID custom field; Manifest вручную | Move/edit и missing list вручную | Scan/edit; комплект вручную | Средний–высокий: export проще API, API только Enterprise; vendor QR надо сопоставить |
| Mobile Inventory | Product/custom barcode + web print | Transaction с Qty=1 | Transaction/context; Trip validation не доказана | Transaction/context; loaded set вручную | Transaction + ручная сверка | Средний–высокий: экспорт есть, публичного API не установлено |
| Scanlily | Item/container + unique label PDF | Location update | Trip field/location вручную | Location update и сверка вручную | Item lookup/update, не handoff flow | Высокий при vendor QR URL; own barcode и full export снижают зависимость |
| Odoo | Package + label/receipt; field print условно | Штатный receipt/package workflow | Internal transfer может представлять движение; Trip mapping нужен | Receipt/transfer; Trip discrepancy mapping нужен | Delivery order/package check; POD Zaberman отдельно | Высокий при полном ERP adoption; API Custom и model mapping; временный слой дорог в сопровождении |
| Onfleet | Order/pieces + dashboard labels; новое место в driver app не установлено | Dedicated receiving не доказан | Route Load для last-mile, не Interstate Trip | Dedicated Interstate unloading не доказан | Required per-piece scan в task | Высокий при переносе dispatch; REST помогает выходу, но Order/Task/labels требуют mapping |

Ни в одной ручной адаптации поле TripID само по себе не блокирует загрузку неверного места. Odoo transfers и Onfleet Route Load можно рассматривать как кандидатов на конкретную операцию только после согласования соответствия исходному Trip/Manifest; переименования интерфейса недостаточно.

Обозначения: **да** — функция документирована; **условно** — нужен print service/настройка/проверка; **не подтверждено** — публичных доказательств недостаточно. Поддержка SDK принтера не означает поддержку этого принтера выбранным SaaS.

| Solution | Type | Barcode/QR generation | Bluetooth printing | Mobile scanning | Multi-user | Offline | API/SDK | Price | Integration potential | Key limitations |
|---|---|---|---|---|---|---|---|---|---|---|
| Orca Scan | Barcode capture | Auto Unique ID; QR/Code 128; own values | Android + Brother plugin + RJ-4250WB; iOS Wi‑Fi | Android/iOS camera, hardware | Paid; 2 Starter / 5 Business | Да; полнота локального каталога и новый print не установлены | REST + Webhooks Business; Node wrapper, не camera SDK | Starter $49/mo; Business $99/mo | Высокий для временного capture adapter | Нет доказанного native Trip control; 30/90 days history; documented printer discontinued |
| BoxHero | Inventory | Generate; barcode/QR | Android + Zebra Print + ZD421T; mobile rugged не доказан | Android/iOS | Business 3 + paid seats | Заявлен; контракт не установлен | REST + Webhooks; native scanner SDK не подтвержден | $30/team/mo | Средний: item/transaction adapter | SKU/Qty model, field TripID не проверяет Manifest; printer docs противоречат общей странице |
| Sortly | Inventory/asset | QR Advanced; barcode Ultra+ | iOS только AirPrint; Android условно через print service | Android/iOS; external scanner | 2 Advanced / 5 Ultra | Mobile да; заранее sync | API + Webhooks только Enterprise | Ultra $149/mo; annual first year $888 | Средний; API требует Enterprise | Нет готового Trip lifecycle; PDF/AirPrint не Bluetooth; лимит карточек |
| Mobile Inventory | Inventory app | Web generator; QR/Code 128 | Не подтверждено; browser/PDF route | Android/iOS; external scanner Android PRO | PRO licensing | Да; shared Android writes по разрешению | Публичный API/SDK не подтвержден | PRO от €7.50/device/mo | Низкий до подтверждения API; экспорт | Product/transaction model; нет подтвержденной mobile printing связки |
| Scanlily | Asset/container | Unique vendor QR; own barcode; PDF | Не подтверждено; PDF + внешний print route | Android/iOS | Ultra 5; Premium unlimited | Scan/status offline не подтвержден | REST endpoints; API Premium по pricing, Business в help | Ultra €29/mo; Premium €59/mo в открытой EUR версии | Средний для items, низкий для операций | Vendor URL labels; тарифные противоречия; API не доказывает полный event export |
| Odoo Inventory + Barcode | WMS/ERP | Unique package codes; ZPL/PDF labels | Штатный mobile BT не подтвержден; network/IoT | Mobile app/scanner; camera | Paid per user | Для целевого workflow не подтвержден | External JSON-2 API Custom; automations/webhooks требуют настройки | Standard $24.90, Custom $49/user/mo на показанном annual offer | Высокий как WMS; тяжелый для временного слоя | Другая transfer model; внедрение; Custom для API; master docs не released guarantee |
| Onfleet Courier Suite | Delivery SaaS | Per-piece QR на order labels | Не подтверждено в driver app; dashboard print | Android/iOS camera | Unlimited users | Driver mode да; new label offline не доказан | REST + Webhooks; embedded barcode SDK не доказан | Scale от $1,349/mo | Высокий для Pickup/Dropoff | Warehouse/Interstate не покрыты доказательствами; покупка dispatch platform ради labels |

Источники строк: [Orca pricing](https://orcascan.com/pricing), [BoxHero pricing](https://www.boxhero.io/docs/pricing), [Sortly pricing](https://www.sortly.com/pricing/), [Mobile Inventory pricing](https://web.mobileinventory.net/licenses), [Scanlily pricing](https://www.scanlily.com/en/pricing), [Odoo pricing](https://www.odoo.com/pricing), [Onfleet pricing](https://onfleet.com/pricing). Источники функциональности приведены в разделах 4, 6 и 7.

### Тарифы и пределы

Цены ниже — публичные значения, без оборудования, доставки, налогов и внедрения. Валюты сохранены; пересчет не выполнялся. Dynamic pricing и регион checkout могут изменить цену. Годовой эквивалент не равен помесячной оплате.

| Продукт | Free/trial и лимиты | Практическая стоимость и ограничение роста |
|---|---|---|
| Orca | Free: 1 user, 1 sheet, 100 rows, history 7 days. Starter: 2 users, 5 sheets, 2,000 rows/sheet, 30 days history | Starter $49/mo + $15/extra user: четыре пользователя $79. Business $99/mo: 5 users, 10 sheets, 10,000 rows/sheet, 90 days. Annual $39/$79 effective per month. REST/Webhooks на Business |
| BoxHero | Personal: 1 member, 100 items, 1 location, 30-day history, без label printing; Business trial 30 days | $30/mo: 3 members, 1,000 items, 3 locations, unlimited transaction history. Четвертый участник +$5: $35/mo. Annual $288/team; +1,000 items $10/mo; +10 locations $10/mo |
| Sortly | Free: 1 user, 100 unique items; 14-day trial paid plans | Advanced $49/mo: 2 users/500 items; Ultra $149: 5/2,000; Premium $299: 8/5,000. API Enterprise quote. Annual first-year offers $288/$888/$1,788; renewal discount отличается |
| Mobile Inventory | Free без team sync; PRO trial один месяц. Одноразовый Android Premium не включает team/cloud | PRO от €7.50/device/mo: минимум €22.50 для трех field devices; дополнительный лицензируемый endpoint считать отдельно. Scanner+ €4/device/mo. Terms: 3 shared inventories, 5,000 products/inventory, 50,000 entries, 1 GB/account и 1,000 images; trial не для production |
| Scanlily | Free: 1 user/500 items; Pro 2/500; Ultra 5/2,000; Premium unlimited users/5,000 | Открытая текущая EUR страница: Pro €9, Ultra €29, Premium €59/mo; annual €90/€290/€590. Иная USD версия показывала $9/$35/$75: это региональные отображения, не валютная конверсия. Купленные QR labels не расходуют item cap, но сами стоят денег |
| Odoo | One App Free: один app, unlimited users; нельзя считать всю связку Inventory + Barcode + integration бесплатно доступной без проверки зависимостей | Показанное annual offer: Standard $24.90/user/mo (reference $31.10), Custom $49 (reference $61); скидка первые 12 месяцев. External API только Custom; Odoo.sh отдельно. Четыре пользователя Custom: $196/mo effective первого года, не цена помесячного checkout |
| Onfleet | Постоянного бесплатного командного плана на pricing нет; trial. Launch 2,500 completed tasks | Launch от $619/mo, Scale от $1,349: 5,000 tasks, barcode scanning. Users unlimited. Courier generation доступна Scale+ couriers; подтвердить состав коммерческого предложения. Pickup и Dropoff — отдельные completed tasks, не одна shipment |

Источники лимитов дополнительно: [Mobile Inventory terms](https://support.mobileinventory.net/articles/terms-and-conditions/), [PRO trial и Premium](https://support.mobileinventory.net/), [Sortly условия промо](https://www.sortly.com/pricing/), [Onfleet barcode availability](https://support.onfleet.com/hc/en-us/articles/37852822362132-Barcode-Scanning-Couriers-and-Clients).

### Настройка и ручные действия

Следующие сроки и оценки действий — **аналитическая оценка**, не SLA поставщиков и не измерения. Предположения: готовые OrderID/TripID, четыре пользователя, один маршрут, доступный принтер, без API; обучение и доставка оборудования не включены. «Действие» — отдельный выбор/ввод/подтверждение, без учета числа нажатий клавиатуры.

| Продукт | Первичная настройка | Pickup на место | Повторная операция | Удобство и необходимость интеграции |
|---|---|---|---|---|
| Orca | 0.5–2 рабочих дня | 5–8: Add → поля → save → print settings → print → наклейка → scan-test | 3–5: scan → операция/контекст → save | Driver/warehouse форма достаточно проста; CSV handoff, API не нужен |
| BoxHero | 1–2 дня | 6–9: item, barcode, атрибуты, stock in, print, scan-test | 4–6: scan → move/out → location → confirm | Удобнее warehouse; водителю мешает stock vocabulary; интеграция не обязательна |
| Sortly | 0.5–2 дня | 6–9: карточка/фото/поля → label PDF → print → scan-test | 3–6: scan → edit/move → save | Наглядно для crew; printing/sync добавляют переключения; API не нужен для теста |
| Mobile Inventory | 1–3 дня | 7–10 с web/PDF printing | 4–6: scan → transaction → context → save | Android полевой учет; печать может потребовать второй интерфейс/PC |
| Scanlily | 1–3 дня | 6–10 через website/PDF либо заранее готовые QR | 3–6: scan → поля/location → save | Удобно для коробок; полная цепочка зависит от сети/внешней печати |
| Odoo | 5–15 дней | 8+ с package/transfer setup | 4–8 в рамках transfer | Warehouse сильнее driver; настройка процессов уже отдельный проект |
| Onfleet | 2–5 дней для Pickup/Dropoff | Dispatcher order setup + dashboard labels; полевая новая печать не доказана | 2–4 в готовой task | Driver flow наиболее специализирован; перенос dispatch данных вручную либо интеграция |

Для всех кандидатов измерить реальную трудоемкость в пилоте. Дополнительные ручные поля OrderID/TripID — главный источник ошибок; общий login запрещен, поскольку теряется actor.

## 6. Оборудование и фактические способы печати

### Сравнение классов

| Устройство/класс | Подключение и smartphone print | Labels и форматы | ПО/SDK | Вывод для Zaberman |
|---|---|---|---|---|
| Brother RJ-4250WB | BT/Wi‑Fi/USB, MFi; Orca Android BT через Brother plugin; Orca iOS Wi‑Fi | Direct thermal; max print width 104 mm; QR/Code 128 и другие | Brother Print SDK Android/iOS | Документированная тестовая связка, но discontinued; использовать имеющийся/арендный аппарат, не стандарт новой закупки |
| Brother RJ-4255WB-L / RuggedJet 4 | BT/Wi‑Fi/USB-C, Android/iOS; -L с battery | До 4-inch labels; max media 114 mm; QR/Code 128; black mark/gap | Native Brother SDK; service compatibility с Orca проверяется отдельно | Предпочтительный класс новой закупки после теста; нужны аккумулятор, charger, носитель |
| Zebra ZQ511/ZQ521 | BT Classic + BLE; MFi; Wi‑Fi зависит от SKU | Print width 72/104 mm; media 35–80 / 50.8–113 mm; QR/Code 128, ZPL/CPCL | Link-OS Android/iOS; готовая SaaS связка зависит от app/service | Хороший альтернативный rugged класс Stage 2; Orca BT на нем не подтвержден |
| Zebra ZD421T с соответствующим BT модулем | Настольный, питание от сети; BoxHero Android через Zebra Print по BT | Thermal transfer; layout под выбранный roll; QR/Code 128 через label rendering/ZPL | Zebra Print на Android, Link-OS | Подтвержденный BoxHero складской тест; не переносной Pickup-принтер |
| Brother QL-810W/QL-820NWB | QL-810W Wi‑Fi, не BT; QL-820NWB дополнительно BT; smartphone route зависит от app | DK labels до 62 mm класса QL; конкретные шаблоны сверять | iPrint&Label/SDK для поддерживаемых моделей | Офисный/складской вариант; не считать QL-810W Bluetooth-моделью |
| Rollo Wireless X1040 | Wi‑Fi/USB, AirPrint; BT используется для setup Wi‑Fi, print по BT не доказан | Shipping 4×6; на Android stock print path ограничен 4×6 | Rollo app для setup; открытый mobile printer SDK не подтвержден | Подходит складу; не соответствует автономному Bluetooth Pickup |
| BIXOLON SPP-R310 | Mobile 3-inch; BT/WLAN зависит от SKU, режим iOS отдельно | Receipt/label/linerless media; QR/Code 128 и пределы label size сверить в command manual перед выбором | Android/iOS UPOS SDK опубликованы | Альтернативный hardware-only путь; конкретная SaaS связка не установлена |

Источники: [Brother RJ-4250WB](https://brothermobilesolutions.com/products/printers/ruggedjet/ruggedjet-4/rj4250wb/), [Brother RJ-4255WB](https://brothermobilesolutions.com/products/printers/ruggedjet/ruggedjet-4/rj4255wb/), [Zebra спецификация](https://www.zebra.com/us/en/products/spec-sheets/printers/mobile/zq511-zq521.html), [Zebra media](https://www.zebra.com/gb/en/products/spec-sheets/printers/mobile/zq511-zq521.html), [BoxHero ZD421T](https://www.boxhero.io/docs/resources/guides/zebra-zd421t/mobile-printing), [Brother mobile guide](https://orcascan.com/guides/files/brother-ql-810w-user-guide-sOOIjc7CLnjUblNzYJNNA-17bf1c08.pdf), [Rollo setup](https://support.rollo.com/support/solutions/articles/29000039959-setup-wireless-rollo-for-first-use), [BIXOLON SDK/spec downloads](https://www.bixolon.com/download_view.php?idx=14).

### Рекомендация по комплектации

На первый тест взять **один demo/арендный Brother RuggedJet 4**, два Android-телефона и третий телефон для приемки/Dropoff. Для покупки выбрать RJ-4255WB-L с аккумулятором; стандартный RJ-4255WB и варианты -L/-LCP/-LF имеют разную комплектацию. Для обычных adhesive die-cut labels не заказывать linerless -LF без необходимости. [Brother variants](https://brothermobilesolutions.com/products/printers/ruggedjet/ruggedjet-4/).

Базовая этикетка пилота: **4×2 inches ≈ 102×51 mm**, QR, короткий alias, Order number, номер места n/N. Такой носитель есть в перечне supplies RJ-4255WB. Это рекомендуемый макет, не подтверждение готового шаблона Orca под все поля. Размер и размещение проверяются одним тестовым roll; 4×6 применять только если нужен дополнительный текст. [Brother supplies](https://brothermobilesolutions.com/products/printers/ruggedjet/ruggedjet-4/rj4255wb/).

Для камеры отдельный сканер не нужен. При большом потоке — 2D imager, поддерживающий QR и HID/keyboard либо vendor SDK. 1D-only лазер не подходит для QR. Совместимость с конкретным телефоном/app и поведение Enter/suffix проверять отдельно; не покупать scanner только по надписи Bluetooth.

Термопечать — простая полевой вариант, но стойкость наклейки зависит от поверхности, влаги, нагрева, трения и срока перевозки. В пилоте проверить гофрокартон, пленку и многоразовую тару. Для долговременной складской маркировки рассмотреть thermal transfer на стационарном принтере. Сравнение технологий: [BoxHero printing](https://www.boxhero.io/docs/key-features/print-barcode).

### Цены оборудования

Официальная страница Rollo показывает **$279.99 Wireless / $199.99 USB**; это US retail без итоговой доставки и налогов. [Rollo printers](https://www.rollo.com/product-category/printers/).

На изученных страницах Brother RuggedJet, Zebra ZQ и BIXOLON нет подтвержденной конечной цены комплекта для региона закупки Zaberman. Поэтому числовая «текущая цена» для них не выдумывается: требуется quotation/demo offer с SKU, battery, charger, гарантийным обслуживанием и расходниками. Цена Rollo не является ориентиром стоимости rugged mobile printer. Необходимая смета пилота приведена в разделе 12 как формула с незаполненными закупочными переменными.

## 7. API и SDK для Stage 2

Фактическая проверка означает чтение публичной документации с endpoints/методами. Authenticated API calls, live webhooks и SDK builds не выполнялись: credentials и устройства не предоставлены. Это документально подтвержденные возможности, а не результаты интеграционного теста.

| Решение | Что действительно опубликовано | Webhooks и scan data | Что не следует предполагать |
|---|---|---|---|
| Orca | REST v1: sheets/rows/fields/history/users; Barcode Image API; Node SDK | WebHook Out для rows/add/update/delete и sheet changes; user email, row ID и event type | REST «Barcode Scanner API» не embedded camera SDK. Сканируют в Orca app. Нет доказанного REST задания на локальный Bluetooth-принтер |
| BoxHero | REST: GET/POST/PUT items, barcode field, attrs; transactions | txs/new/edit/delete, item events; event ID, time, created_by для transactions | Это inventory transaction, не каждый camera decode. Порядок webhooks не гарантирован; file-type attrs API не возвращает |
| Sortly | Enterprise REST: create/update/move items, folders/custom fields; OpenAPI | Webhooks в guides; event-to-business mapping требует проверки | API не доступен на Ultra; printer control/camera SDK не подтвержден |
| Scanlily | GET /getitems, POST /createitem, POST /updateitem | История в app; полный scan-event feed/webhooks публично не подтверждены | /updateitem описан для quantity/price; нельзя обещать произвольные операции Trip и полный audit export. Help «Business» конфликтует с pricing «Premium» |
| Mobile Inventory | Публичных endpoints не установлено; import/export доступны | Transaction records внутри продукта | Нельзя обещать REST/Webhooks по общему упоминанию API в terms |
| Odoo | JSON-2 API с версии 19; методы конкретной DB отражены в /doc; Custom plan | Webhook automations конфигурируются; не готовый cargo event contract | RPC/model API не мобильный scan/print SDK; API plan и deployed version обязательны |
| Onfleet | REST tasks/orders/workers; requested/captured barcodes | GET task → barcodes.captured: id, symbology, data base64, time, location; task webhooks | Capture docs указывают Onfleet driver app. Pricing mention driver SDK не доказывает отдельный barcode scanner SDK для Zaberman |

Проверенные developer sources: [Orca REST](https://orcascan.com/guides/barcode-scanning-rest-api-f09a21c3), [Orca Webhooks](https://orcascan.com/guides/capture-barcode-scan-events-with-webhooks-da8bbe42), [Orca QR Image API](https://orcascan.com/tools/qr-code-generator), [BoxHero items](https://www.boxhero.io/docs/developers/api/reference/items), [BoxHero webhook contract](https://www.boxhero.io/docs/developers/webhooks/overview), [Sortly guides](https://developer.sortly.com/guides), [Scanlily API](https://www.scanlily.com/en/features/api), [Odoo 19 API](https://www.odoo.com/documentation/19.0/es_419/developer/reference/external_api.html), [Odoo webhook automations](https://www.odoo.com/documentation/19.0/applications/studio/automated_actions.html), [Onfleet capture](https://docs.onfleet.com/reference/capturing), [Onfleet webhooks](https://docs.onfleet.com/reference/webhooks).

У Orca Validation URL позволяет approve/reject/modify данные до save, но требует внешний endpoint и ответа за **750 ms**, иначе результат игнорируется. Это уже разработка/интеграция и не решение offline manifest validation для Stage 1. [Validation contract](https://orcascan.com/guides/barcode-scan-validation-webhook-56928ff9).

### Hardware SDK без SaaS

**Brother Print SDK** поддерживает Android/iOS, печать изображений/PDF/templates и локальное подключение. RJ-4250WB/RJ-4255WB перечислены среди поддерживаемых моделей. iOS Bluetooth/MFi выпуск приложения требует процесса PPID, указанного Brother. Приложение производителя для production printing не обязательно после собственной SDK-интеграции; setup utility может оставаться. [Supported printers](https://support.brother.com/g/s/es/htmldoc/mobilesdk/overview/supported-printer.html), [SDK download и PPID](https://support.brother.com/g/s/es/dev/en/mobilesdk/download/index.html?c=eu_ot&comple=on&lang=en&redirect=on), [OS requirements](https://support.brother.com/g/s/es/htmldoc/mobilesdk/overview/supported-environment.html).

**Zebra Link-OS Multiplatform SDK** имеет Java Android, Objective-C iOS и .NET MAUI; поддерживает Link-OS printers, включая ZQ series с исключениями. Доступны библиотеки, API и samples; Bluetooth/print status доступны через соответствующие connection/printer APIs. Не смешивать Link-OS с лицензируемым Enterprise Browser и не переносить поддержку на ZQ120/220 Plus, исключенные из списка. [TechDocs](https://techdocs.zebra.com/link-os/), [SDK supported hardware](https://www.zebra.com/gb/en/support-downloads/software/printer-software/link-os-multiplatform-sdk.html).

**BIXOLON** публикует Android/iOS UPOS SDK для SPP-R310. Можно использовать отдельно от SaaS, но нужно проверить label media/sensors, SKU и конкретные методы QR/Code 128. [Downloads](https://www.bixolon.com/download_view.php?idx=14).

SaaS server API не может сам обратиться к Bluetooth-принтеру телефона. Между локальным print job и hardware требуется mobile app/print service/SDK. Генерация barcode image, отправка print bytes и регистрация успешной маркировки — три разные функции.

### Сканирование внутри Zaberman

На Android применим ML Kit Barcode Scanning с **bundled model**, чтобы не зависеть от первичной загрузки модели; SDK возвращает raw value и format локально. На iOS применим Apple Vision VNDetectBarcodesRequest; поддерживаемые symbologies следует проверять на целевой OS. Это отдельные сканирующие компоненты, не API inventory SaaS. [ML Kit Android](https://developers.google.com/ml-kit/vision/barcode-scanning/android), [ML Kit offline](https://developers.google.com/ml-kit/vision/barcode-scanning?authuser=09), [Apple Vision](https://developer.apple.com/documentation/vision/vndetectbarcodesrequest/symbologies).

Факт camera decode не равен факту Loading. Zaberman должен сохранять event только после проверки контекста и подтверждения действия. External scanner HID может использовать обычный ввод PlaceID; SDK нужен, когда требуются device control/metadata, а не автоматически для каждого сканера.

## 8. Сравнение архитектурных вариантов

Оценки сроков — рабочие ориентиры без закупки/согласований. Стоимость разработки не оценена без backlog, числа платформ и существующих production API.

| Вариант | Преимущества | Ограничения и стоимость | Запуск и масштабирование | Зависимость и дальнейшая интеграция |
|---|---|---|---|---|
| A Ready SaaS + mobile app | Быстрые handoff/roles/history, support | SaaS monthly; printers и Trip правила могут не покрываться. Onfleet Scale от $1,349/mo; кодирование в его order/task model | 2–5 дней для узкого handoff, больше для migration; scale внутри тарифов | Высокая зависимость процессов; adapter может сохраниться, UI vendor заменяется |
| B Barcode/inventory SaaS + Bluetooth printer | Самый малый Stage 1 scope; уже есть mobile form, scan, export | Orca $79/mo на 4 users либо $99 Business + hardware; часть сверок ручная | 0.5–3 дня setup; рост мест расходует rows/items/history и пользователей | Средняя; независимые коды/export позволяют уйти. Printer adapter все равно нужен в своем app |
| C Zaberman app + printer SDK | Строгие Trip checks, единый actor/event model, локальная печать | Собственная реализация offline/sync; SDK не создает бизнес-логику и не устраняет MFi/OS constraints | Планирование в неделях, оценка после пилота; масштабируется с backend/field fleet | Низкая SaaS-зависимость; hardware зависимость изолируется небольшим adapter |
| D Собственная Barcode/QR логика без SaaS | ID, labels, events и данные полностью под контролем | Нужно строить весь operational workflow; raw BT/protocol support самому повышает обслуживание | Медленнее B; без printer SDK срок/риски выше | Минимальная SaaS-зависимость; риски собственного print transport |

**C и D частично пересекаются.** QR/ID/business logic можно иметь полностью свои и при этом использовать бесплатный/лицензируемый hardware SDK. Рекомендуемый Stage 2 — **D для данных и логики + C для аппаратного подключения**. Избегать самостоятельной реализации Bluetooth transport, если штатный SDK закрывает задачу.

## 9. Top 3 решения для быстрого пилота

| Место | Решение | Когда выбирать | Условие допуска |
|---|---|---|---|
| 1 | Orca Scan + Android + Brother RuggedJet | Проверить все handoff на одной форме, нужен переносимый capture слой | Успешные новый ID → print → scan-test, access к местам другого сотрудника offline, экспорт истории |
| 2 | BoxHero + Android + Zebra Print | Бюджетный warehouse-first пилот; уже есть ZD421T либо другая проверенная печать | Отдельный item на место, Qty=1; подтверждение mobile printer пути для Pickup; no false manifest completion |
| 3 | Sortly Ultra + совместимый print service | Важна карточка с фото и простой visual inventory; API сейчас не нужен | Тест Android Bluetooth; offline read/write и reprint; согласие на Enterprise quote при будущей интеграции |

Это shortlist **кандидатов**, не трех полностью соответствующих ТЗ продуктов. Если обязательны iOS Bluetooth printing и полноценное offline создание/печать без PC уже в пилоте, готовый победитель документально не установлен. Не менять условие на Wi‑Fi молча.

Onfleet имеет более готовые Pickup/Dropoff проверки, но не входит в Top 3 из-за стоимости, отсутствия подтвержденного полевого Bluetooth print и необходимости затронуть dispatch. Если Onfleet уже является Order/Dispatch master Zaberman, его позицию нужно пересмотреть.

## 10. Рекомендованное решение Stage 1

**Orca Scan Starter, четыре персональных аккаунта, Android, один мобильный Brother.** Сначала короткий технический bench-test на Free с одним пользователем; для реального командного пилота — платный Starter. Business брать только при необходимости API/Webhooks либо пяти пользователей/длинной истории. Не покупать годовую подписку до field-test.

Использовать одну shared sheet **CargoPlace**. Barcode — идентификатор конкретного места; поля: OrderID, PlaceNo, PlaceCount, internal_name, L/W/H, weight_value, quality/reason, current Location, current Operation, TripID и exception note. Историю действий использовать как временный журнал, с отдельными milestone timestamp/actor при необходимости. Настройка обязательных полей и сохранение оригинального event time проверяются на bench-test.

**Допустимый временный компромисс:** vendor-generated opaque barcode как внешний label identifier, не primary PlaceID production DB. До UUIDv7 migration сохранить mapping `source_system + external_item_id + barcode_value → PlaceID`. Если уже есть реальные PlaceID, импортировать их значения вместо генерации новых. Vendor ID не объявлять UUIDv7. Это ограничение as-is пилота; принятый production baseline остается прежним.

Pickup: создать запись на смартфоне → получить уникальный код → распечатать → наклеить → scan-test → явно сохранить Pickup. Если mobile auto-ID/local print не проходит тест, field launch по полной цепочке **не допускать**. Предварительно созданный пул кодов может проверить наклейки/сканирование, но такой тест отмечается как сокращенный и не засчитывает создание на Pickup.

Warehouse/Loading/Unloading/Dropoff: scan → проверить OrderID/TripID и список ожидаемых PlaceID → записать выбранную операцию/Location → save. Для Stage 1 ожидаемый список готовит supervisor из существующих Order/Trip данных, без изменения их владельца. Inventory SaaS не должен автоматически завершать Order, Trip или BOL.

История inventory updates временно фиксирует действия, но не заменяет immutable operational event store. Отсутствие жесткой проверки manifest компенсируется ручной сверкой supervisor; это **ограничение масштабирования**, а не будущая архитектура. После пилота выбирать либо перенос в Zaberman, либо продукт с доказанными required checks.

## 11. Рекомендованная архитектура Stage 2 и идентификатор

### Что перенести и что сохранить

| Компонент | Stage 1 | Stage 2 |
|---|---|---|
| CargoPlace registry и attributes | Временная SaaS sheet с export | Zaberman operational DB |
| Order/Task/RouteRun planning | Текущий источник, ручной перенос нужных IDs | Approved Order/Dispatch master и adapter |
| Trip Manifest и подтвержденные sets | Текущий Trip источник + supervisor сверка | Zaberman Trip/Manifest с per-place validation |
| Scan/операционные события | SaaS history + архив выгрузок | Собственный event store; actor/device/event ID/original time |
| ID и QR image | SaaS value/image либо импорт собственных ID | UUIDv7 и local encoder без SaaS/network |
| Print | System print service и vendor plugin | Brother/Zebra hardware SDK adapter, local queue |
| Camera scan | Внешнее mobile app | Local scanner SDK внутри Zaberman |
| Photos/docs | Временные attachments с export | Object storage + metadata; document module отдельно |
| SaaS | Capture/history для пилота | Удалить после verified migration; optional read-only archive |

Сохранять после Stage 1 имеет смысл **сам принтер, носители, подтвержденный label layout и при необходимости hardware SDK**. REST/Webhooks SaaS использовать только как переходный adapter. Не оставлять обязательную зависимость от внешнего label image endpoint для offline печати.

Не привязывать к SaaS: PlaceID, OrderID/TripID, бизнес-статусы и operation types, label payload version, device/user identity, event identity, Manifest, адреса хранения оригинального evidence и lifecycle BOL/POD.

### Формат кода

Рекомендация production: `ZCP1:<UUIDv7>`; пример формы `ZCP1:xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx`. Prefix — namespace и версия, UUID — opaque identity. Это предложенная сериализация принятого контракта, а не существующий реализованный формат. QR не должен содержать имя клиента, адрес, OrderID, TripID, статус, размеры или vendor URL.

Человекочитаемая часть: короткий уникальный alias, Order number, место `3/8`, internal_name при необходимости. Номер `3/8` может стать устаревшим после Supplemental Pickup: код и PlaceID не меняются, учет состава определяется данными операции/snapshot. QR нужен для ID, напечатанный текст — для физической сверки.

**Почему QR:** длинный versioned UUID в Code 128 занимает много ширины; QR удобнее разместить на 4×2-inch label и читать камерой/2D imager. Это инженерная оценка для данного payload, подлежащая сравнению на настоящих этикетках. Code 128 оставить дополнительным форматом только после теста длины/scan distance; текущий wireframe не считать hardware validation.

Code 128 с коротким alias возможен как отдельный scan alias, но отличается от baseline payload и требует явного alias resolver. Не заменять им primary PlaceID без продуктового решения. QR и Code 128 на одной этикетке на первом этапе не обязательны: два разных payload создают неоднозначность.

GS1 SSCC имеет смысл при требовании совместимости партнеров: это 18-значный identifier логистической единицы, с GS1 Company Prefix и правилами выдачи. Для внутреннего пилота выбирать его только ради «стандарта» не нужно. При необходимости SSCC хранить как отдельный внешний идентификатор, связанный с PlaceID. [GS1 SSCC](https://www.gs1.org/standards/id-keys/sscc), [GS1 Logistic Label Guideline](https://www.gs1.org/standards/gs1-logistic-label-guideline/1-3).

### События и повторная печать

Минимальное production-событие: event_id, PlaceID, operation_type, operation_id, OrderID, TripID при применимости, from/to Location, occurred_at, received_at, actor_id, device_id, result и reason. Сервер дедуплицирует по event_id; бизнес-проверка предотвращает повторный Load в одном Trip. Это развитие уже принятой модели событий, не параллельная система процессов.

Lookup → найденная карточка; Load/Receive/Dropoff → отдельное подтверждение контекста. Offline сохраняет локальный факт как pending, сервер окончательно подтверждает допустимый переход. HTTP retry не должен повторно перемещать груз.

Reprint: тот же PlaceID и active code, отдельная причина/actor/time; не новый CargoPlace. Replacement: тот же PlaceID, новый alias, старый alias replaced/void с сохранением связи. В рекомендованном stable PlaceID QR основной ID не меняется; если бизнес требует сделать именно старый QR недействительным, понадобится versioned label-instance token и resolver — это отдельное решение, не обещание базового payload. В Stage 1 проверить reprint; управляемая replacement semantics SaaS не установлена.

## 12. План MVP пилота

### Состав и границы

**Две недели**, 20 тестовых Orders, 100 физических мест, один origin warehouse, один destination warehouse, два Trip. Четыре аккаунта: Pickup/Dropoff driver, origin warehouse employee, destination employee, supervisor/admin. Три Android-телефона; один printer на Pickup; одна supervisor workstation. Числа — предложенный объем пилота, не фактическая нагрузка Zaberman.

ПО: Orca Starter, Brother Print Service Plugin на Android, настроенный шаблон label, исходные Order/Trip списки и папка для ежедневного архива. Интеграция, новый backend, BOL generation и автоматические уведомления в пилот не входят. Реальные подписанные документы ведутся в действующем процессе.

Цепочка: **CargoPlace creation → unique code → Bluetooth print → Pickup scan-test → Warehouse receiving scan → Trip loading scan → Trip unloading scan → Dropoff scan**. Выгрузка включена отдельно, хотя в сокращенном примере MVP ее нет.

| Этап | Операция и ожидаемый результат | Как контролировать as-is |
|---|---|---|
| Pickup | Создать каждый CargoPlace, связать с Order, label/scan-test, сохранить факт | Сверка наклейки с карточкой и физическим местом; каждое место Qty=1 |
| Warehouse receiving | Найти место, подтвердить arrival в origin warehouse | Ожидаемые PlaceID из Pickup; неизвестное не создавать как новую карточку |
| Interstate loading | Выбрать Trip, сравнить принадлежность, отметить фактически загруженные | Supervisor сверяет set с Manifest; missing/wrong/extra отдельно |
| Interstate unloading | Сравнить received set с loaded set, записать destination | Недостача из факта загрузки, а не из исходного Order quantity |
| Dropoff | Сканировать передаваемые места и сверить состав доставки | Частичную передачу не считать complete; POD в действующем процессе |

### Порядок проведения

1. **День 1–2: bench-test до закупки.** Подготовить 10 мест. На смартфоне создать новое место, получить ID, print QR по Bluetooth без PC и scan-test. Повторить после restart и без WAN, сохранив Bluetooth включенным. Снять отдельные результаты для creation, generation, print и scan. Если RJ-4255WB не работает через plugin, не переносить на него вывод о RJ-4250WB.
2. **День 2–3: setup и обучение.** Настроить поля/права/labels; импортировать тестовые OrderID/TripID; определить one writer на этап и владельца расхождений. Пользователям запретить удаление/очистку реестра; сохранить контрольную выгрузку.
3. **День 4–8: две полные цепочки.** Пройти все пять операций на 100 местах, включая частичную loading/unloading. Ежедневно сверять место, history и ожидаемые списки; отдельно записывать время и число действий.
4. **День 9: offline/conflict/recovery.** Два устройства создают новые места offline; второй сотрудник читает место первого; трижды retry/sync; kill/restart app; printer sleep/reconnect; damage/reprint; competing updates одного места.
5. **День 10: exit-test.** Выгрузить карточки, коды, все доступные события и attachments. Найти 10 случайных мест и восстановить всю цепочку с actor/time/Order/Trip. Составить Go/Conditional Go/No Go, список сокращений и бюджет следующего этапа.

Не проводить критический приемочный offline-тест только на своем My Scans: особенно важно место, созданное **другим** пользователем и предварительно синхронизированное на принимающий телефон. Документация Orca отдельно описывает My Scans как offline-access; полнота shared catalogue должна быть доказана тестом. [Orca mobile storage](https://orcascan.com/guides/orca-scan-mobile-app-76ecf6ed).

### Набор негативных тестов

| Тест | Ожидаемый бизнес-результат |
|---|---|
| Два одинаковых физически места одного Order | Два разных ID; нет объединения в SKU Qty=2 |
| Одно место содержит несколько предметов | Один PlaceID, содержимое/units отдельно |
| Повторный scan одного PlaceID в том же loading | Не второй Load; повтор отмечен, фактический count не растет |
| Скан места чужого Trip / неизвестного кода | Не accepted Load; exception или ручная остановка, не автоматическое создание |
| Из 8 мест загружены 6, получены 5 | Loaded=6; received=5; missing=1 относительно загрузки; незагруженные 2 отдельно |
| Поврежденная наклейка / reprint | Найден тот же PlaceID; история сохранена; reason/actor reprint проверены |
| Интернет пропал после save/print | Видимое локальное сохранение, один итоговый факт после sync |
| Два offline creators | Ни одного совпавшего ID; данные одного места не перезаписывают другое |
| Одно место изменено на двух телефонах | Не молчаливая потеря факта; обнаружение/разбор supervisor, результат зафиксирован |
| Частичный Dropoff / refused / damage | Переданные места отдельно; Order не объявлен полностью доставленным |

### Критерии успешности

Это предложенные acceptance thresholds, не заявления о возможностях SaaS.

- **0 дублирующихся ID**, 100/100 мест имеют физическую наклейку и correct scan-test.
- **Не менее 98%** обычных labels прочитаны с первой попытки в тестовых условиях; все остальные — со второй попытки/manual fallback без ошибочной идентификации.
- **95% scan lookup ≤ 3 секунд**, **95% print dispatch → label ready ≤ 15 секунд** после начального pairing, без наклейки и ввода размеров.
- Все полевые labels печатаются с телефона по Bluetooth без PC/WAN; time-to-create-and-mark отдельно, целевой median ≤ 60 секунд без измерений/фото.
- 100% ожидаемых handoff в export связываются с PlaceID, OrderID, operation, actor/time; для loading/unloading присутствует TripID.
- Все 10 негативных сценариев выявлены; wrong/extra/duplicate не попадают в подтвержденный состав. Для Stage 1 ручной контроль допускается и считается отдельно от автоматического.
- Offline-тест ≥ 30 минут, включая 20 новых мест на двух телефонах; после reconnect ≤ 5 минут до появления всех тестовых записей при рабочей сети; 0 потерянных фактов/ID collisions.
- Три повторных sync не увеличивают confirmed count. 10/10 случайных мест восстановлены из exit export без входа в SaaS.

Если строгие автоматические Manifest checks отсутствуют, результат максимум **Conditional Go для контролируемого пилота**, не Go для масштабного внедрения. Потеря факта, совпадение ID, невозможность нового field print либо неизвестное место, незаметно принятое в Trip, — No Go для полного сценария.

### Бюджет и формулы

Для четырех пользователей Orca Starter: `49 + max(0, 4 − 2) × 15 = $79/месяц`. Проверка: два пользователя → $49; три → $64; четыре → $79; пять → $94, рядом с Business $99 с API и более длинной историей. Для небольшого pilot без API Starter проще. [Orca prices](https://orcascan.com/pricing).

`Pilot cost = SaaS + printer rental/purchase + battery/charger + labels + optional scanner + shipping/tax + setup/training labor`.

Телефоны/workstation можно использовать имеющиеся; их дополнительные затраты тогда ноль, но время сотрудников учитывается. Printer cost до quotation неизвестен. Не суммировать USD и EUR без согласованного курса/даты.

`Label count = places × (1 + reprint rate)`; при 100 places и резерве 20% нужно 120 labels, практический минимум — доступный roll не менее 200 labels. Резерв — предположение для теста.

`Monthly registry size = places created per day × retention days`, если все записи продолжают расходовать row/item cap. Пример: 100 мест/день × 30 дней = 3,000, выше Starter 2,000/sheet. Из этого не следует удалять историю или дробить каждую смену на sheet: сначала проверить archive billing, row add-ons и retained history.

`Operational benefit = minutes saved × operations per day × loaded labor cost per minute + avoided error cost`. До/после считать на одном наборе операций; расходы на ручную supervisor сверку и повторный ввод вычитать. Пилот оценивает и надежность, и трудоемкость; снижение потерь заранее не обещается.

## 13. Риски и ограничения

| Риск | Влияние | Практическая мера |
|---|---|---|
| BT scanner принят за BT printer; BLE setup принят за print | Несовместимая закупка | Тест app × OS × printer SKU × connection × label; запись фактического способа |
| Документированный RJ-4250WB discontinued | Нет устройств/поддержки/расходников | Demo актуального RuggedJet до bulk purchase; rental legacy только для теста |
| iOS hardware MFi ≠ готовая iOS SaaS печать | Невозможность полевого print | Не обещать Bluetooth iPhone по datasheet; проверить приложение и PPID для Stage 2 |
| Offline только свой локальный subset | Warehouse не узнает место водителя | Синхронизация manifest/catalogue заранее и test другого actor |
| Vendor Unique ID не UUIDv7 | Архитектурный тупик/смена labels | Immutable mapping, namespace, запрет повторного использования ID |
| Status overwrite вместо событий | Потеря chain of custody и времени | Проверить history/export, archived events; не считать last status достаточным |
| SaaS разрешает unknown item creation | Лишнее место/ошибочная loading | Ограничения прав и stop procedure; автоматические checks в Stage 2 |
| Manual OrderID/TripID | Ошибочная связь | Подготовленные controlled lists, сверка supervisor; замер ручного времени |
| Короткая history retention | История истекает до расследования | Ежедневный export; проверка event export до запуска; migration до окончания retention |
| SKU licenses расходуются на каждое место | Рост стоимости быстрее ожиданий | Прогноз places/day × retention, archive/add-on rules; не объединять places ради тарифа |
| Наклейки отклеиваются/выцветают; printer sleep/battery | Остановка процесса/перепечатки | Материал/adhesive test, power kit, spare roll, manual alias fallback |
| API/events не равны исходному факту | Дубли/потеря actor или original time | Exit-test; event_id, idempotent adapter, server reconciliation в Stage 2 |
| Public vendor QR URL | Раскрытие cargo/client data и зависимость домена | Private records, минимум данных в коде, own opaque payload |
| Onfleet/Odoo расширяют scope | Маркировка превращается в ERP/dispatch проект | Выбирать только при отдельной бизнес-необходимости |
| Обновляющиеся тарифы и help pages | Покупка неверного плана/функции | Зафиксировать checkout/quotation и функции в аккаунте перед оплатой |

Исследование выполнено по официальным открытым страницам. Реальные apps, firmware, offline conflicts, печать и API под credentials не тестировались. Отсутствие публичного доказательства отмечено как «не подтверждено», а не как доказанное отсутствие функции.

## 14. Open Questions и окончательная рекомендация

Перед закупкой/полевым запуском требуется определить:

1. **Android-only допустим для первого пилота или iPhone обязателен для printing?** Рекомендованное предположение: Android-only для print, iOS оценивается отдельно.
2. **Где закупка и поддержка оборудования?** Нужны страна, поставщик, аренда/demo, полный SKU, warranty и quotation.
3. **Сколько places/day и срок хранения истории?** Устанавливает row/item cap и пригодность временного SaaS.
4. **Какой текущий Order/Dispatch master?** Есть ли уже Onfleet/Odoo/иной сервис и CSV manifest? Существующая лицензия может изменить shortlist.
5. **Какой источник TripID и фактически loaded manifest?** Без него нельзя принимать unloading по надежному ожидаемому составу.
6. **Какие поверхности, температура и длительность перевозки?** Определяет расходники и пригодность direct thermal.
7. **Кто вправе подтверждать missing/extra/damage и частичную передачу?** До пилота назначить supervisor и запрет ложного complete.
8. **Разрешен ли временный SaaS для production cargo data?** Уточнить retention, доступ и export; для bench-test достаточно неперсональных тестовых данных.
9. **Нужна ли invalidation старого QR при replacement?** Stable PlaceID payload и отзыв конкретной наклейки требуют разных правил.
10. **Требуют ли партнеры GS1 SSCC либо только внутренний code?** По умолчанию внутренний QR, без GS1 procurement.

Недостающие данные не мешают документальному выбору кандидата, но влияют на покупку и условия допуска. Никакие ответы здесь не считаются полученными по умолчанию; указанные предположения — предложения для пилота.

**Решение:** сначала провести bench-test Orca + Android + demo Brother RuggedJet, затем двухнедельный командный pilot без разработки. На Stage 1 временно использовать capture, карточки и history внешнего SaaS. На Stage 2 перенести CargoPlace, операции, Manifest validation, ID, scan, offline queue и audit в Zaberman, сохранив принтер и vendor SDK. Масштабирование допускается только после доказанной надежности учета; отсутствие полного готового продукта не является основанием начинать разработку до проверки shortlist.

