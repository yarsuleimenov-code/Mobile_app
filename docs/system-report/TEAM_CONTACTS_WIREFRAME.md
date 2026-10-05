# MOB — Team contacts

Статус 2026-10-05: реализовано и принято owner, включая сокращённые Telegram handles и полные адреса; push в main разрешён. Цель — водитель быстро связывается с ответственным по заказу и передаёт контекст без повторного поиска данных.

## Scope и сценарий

- Карточка Team contacts в начале Order details. Входы: Order details из Tasks, Team contacts / Order details из Pickup и Dropoff.
- Dispatcher, Broker, Manager: имя и @nickname со ссылкой https://t.me/nickname, в новой вкладке/приложении согласно настройкам устройства. Customer SMS остаётся отдельным каналом. Сообщения автоматически не отправляются.
- Статические назначения для семи заказов маршрута; 23343775 и 23343778 имеют разных диспетчеров. У 23343778 Broker не назначен. Неизвестный заказ показывает Not assigned во всех ролях, без ссылок.
- Контекст: номер, операционное название, количество, операция/номер остановки, адрес, запланированные дата/время, Special Cargo и заметка заказа при наличии. Используются текущие сохранённые данные заказа, не история подписанного документа и не несохранённые изменения Names.
- Copy order summary копирует этот контекст, без customer phone, OTP, подписей или комментариев сторон. При отказе Clipboard доступен read-only текст с выделением для ручного копирования. Кнопка работает офлайн в доступном локальном состоянии.
- stopId и operation передаются из задач/операций. При нескольких подходящих остановках необходим выбор Order stop; первая не выбирается автоматически. Неверная/чужая остановка не подменяется другой. При отсутствии адреса/количества показывается Not available / Not recorded.

## Ограничения

Telegram handles сокращены: @casey_zaberman, @alex_zaberman, @jordan_zaberman, @taylor_zaberman, @sam_zaberman. Это по-прежнему непроверенные демонстрационные контакты.

Все семь остановок содержат улицу, номер, город, штат, ZIP и USA. Использованы реальные публичные объекты только для демонстрации, не адреса клиентов. Источники: [Belmont Town Offices](https://www.belmont-ma.gov/400/Administration), [Woburn City Hall](https://woburnma.gov/contacts/), [Holden Town Hall](https://www.holdenma.gov/165/Government), [West Hartford Town Hall](https://www.westhartfordct.gov/town-departments), [Bedford Town House](https://www.bedfordny.gov/213/About-Bedford), [Greenwich Town Hall](https://www.greenwichct.gov/863/About-Town-Hall), [Cos Cob Library](https://www.greenwichlibrary.org/hours-locations/). Для West Hartford ZIP исправлен на 06107. Неизменённые городские адреса ранее сохранённого стандартного маршрута обновляются после reload; другие маршруты и изменённые адреса сохраняются.

Имена и Telegram handles вымышленные, не проверенные аккаунты сотрудников; Telegram не резервирует демонстрационные usernames. Перед внешним показом заменить на согласованные адресаты либо не открывать ссылки. В UI по правилам проекта нет mock-пометок; ведущий объясняет природу данных устно. QA проверяет href/target, но не открывает sample-аккаунты и не отправляет сообщения.

Без CRM/Telegram API, каталога сотрудников, прав редактирования команды, рабочего времени, online-статуса или карты. Внешняя навигация — следующая отдельная задача. Clipboard зависит от permissions/secure context. Адреса и расписание — текущий локальный маршрут, не live Spoke.

## Проверка и файлы

5 новых domain tests контактов: разные назначения, отсутствие ролей, безопасный nickname, точный order/operation/stop, состав копирования и отсутствующие данные. Дополнительный тест обновления прежних адресов сохраняет изменённые адреса/маршруты. Всего 148 tests passed; TypeScript и сборки проверены.

Chrome/Playwright (Browser plugin unavailable): Pickup/Dropoff/Tasks → Team contacts, Clipboard success/denied, refresh/back, два заказа, неизвестный заказ, две остановки одного заказа, неверный stopId, 320/390/1440 px. Ошибок приложения/горизонтального переполнения нет. Скриншоты проверены отдельно, вне репозитория.

Основные файлы: teamContactsDomain.ts, TeamContactsCard.tsx, OrderDetailsScreen.tsx; ссылки Pickup/Dropoff/Tasks и stopId в spokeTaskPath. Модель eBOL и подписанные версии не изменены.
