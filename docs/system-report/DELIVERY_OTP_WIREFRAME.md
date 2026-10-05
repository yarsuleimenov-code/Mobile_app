# MOB — подтверждение передачи OTP

Дата: 2026-09-30
Статус: hi-fi wireframe для бизнес-валидации; production-интеграция не реализована.

Принятое дополнение 2026-10-05: необязательный Contact comment (reported) вводится до OTP-проверки. После проверки поле блокируется; редактирование либо изменение исключения требует повторной проверки. Driver comment вводится на шаге подписи водителя. [Правила комментариев](HANDOFF_COMMENTS_SIGNING_WIREFRAME.md); push разрешён.

## Цель и scope

Контакт может подтвердить любой Pickup или Delivery одноразовым SMS-кодом. После проверки OTP водитель подписывает соответствующий snapshot; eBOL/POD показывает факт OTP-проверки.

Минимальный сценарий:

1. На Pickup или Delivery review приложение показывает зарегистрированный контакт и маскированный номер.
2. Водитель отправляет код; номер нельзя изменить на экране передачи.
3. Контакт сообщает шестизначный код водителю.
4. После успешной проверки доступна подпись водителя.
5. eBOL/POD хранит способ подтверждения, контакт, последние 4 цифры номера и время; сам OTP не хранится и не показывается.

## Принятые правила

- OTP доступен в каждом Pickup и Delivery/Dropoff как один из двух способов подтверждения наряду с Sign on device.
- В wireframe успешен любой шестизначный код, кроме `111111`. Код `111111` зарезервирован для демонстрации ошибки.
- Код: 6 цифр, срок действия в целевой реализации — 10 минут.
- Максимум 3 попытки ввода. После этого проверка блокируется; дальнейшее решение принимает диспетчер/супервайзер.
- Максимум 3 отправки в рамках handoff.
- Offline не позволяет проверить OTP: показывается ошибка доставки SMS, завершение заблокировано.
- После блокировки OTP дальнейший способ завершения определяет диспетчер/супервайзер.

## Сценарии Administration

Preset `OTP Delivery`, заказ `#99007008`:

- Success — любой шестизначный код, кроме `111111`;
- `111111` — ошибка ввода и блокировка после трёх неуспешных попыток;
- Expired code — предложение отправить новый код;
- SMS delivery error — повтор или обращение к диспетчеру;
- Offline — SMS delivery error.

Это управляемые состояния wireframe. SMS, webhook и backend-проверка отсутствуют.

## Production gate: Twilio

Отдельные OTP-коды регистрировать не требуется. Регистрируются владелец аккаунта/компания, Twilio Verify Service и при необходимости SMS template или sender.

### Порядок регистрации

1. Создать корпоративный Twilio account на служебную почту, подключить billing и назначить владельца и резервного администратора. Trial разрешает отправку только на заранее подтверждённые номера.
2. В `Communications → Trust Hub → Profiles` создать **Primary Business Compliance Profile** и отправить его на проверку. Подготовить юридическое название и адрес, страну, регистрационный номер/EIN/DUNS, сайт, отрасль, данные и контакты уполномоченного представителя, notification email и запрошенные документы. До отправки на любые номера дождаться `Twilio Approved`.
3. В `Verify → Services` создать production **Verify Service**: friendly name `Zaberman Handoff`, SMS channel, code length 6, стандартный TTL 10 минут, Fraud Guard enabled. `Do not share` warning должен быть выключен, потому что контакт передаёт код уполномоченному водителю.
4. Выбрать pre-approved template либо запросить custom template: `Your Zaberman handoff code is: {code}. Give this code only to the Zaberman driver.` Custom template используется только после одобрения Twilio.
5. В `Verify → Settings → Geo permissions` разрешить только фактические страны доставки и отключить остальные направления.
6. До отправки получить явное согласие получателя на одноразовое transactional SMS и хранить номер, timestamp, источник и версию текста согласия. Для США/Канады форма согласия должна содержать сведения о message/data rates, ссылки на Terms и Privacy Policy, HELP/STOP и контакт поддержки.
7. Создать restricted API Key/Secret и сохранить вместе с Verify Service SID только в backend secret storage. Мобильный клиент вызывает собственные backend endpoints `send/check` и не получает Twilio credentials.
8. Настроить лимиты по заказу, телефону, сотруднику, устройству и IP, максимум три отправки/проверки в handoff, мониторинг затрат и delivery failures, audit и supervisor override.

### Нужна ли A2P 10DLC

- Для OTP-only через Twilio Verify отдельная A2P 10DLC Campaign обычно не нужна; Verify сам выбирает маршрут, и отдельный Twilio phone number для стандартного сценария не требуется.
- Если коды отправляются с корпоративного US 10DLC номера через Programmable Messaging, необходимо дополнительно зарегистрировать Brand и Campaign, привязать номер к Messaging Service и дождаться carrier approval.

### Граница прототипа

Правило wireframe «любой шестизначный код, кроме `111111`» существует только для демонстрации. Production backend должен передавать введённый код в Twilio Verification Check и принимать только фактически сгенерированный Twilio код. Хранятся verification SID, outcome, actor и timestamps; полный номер и введённый код не логируются.

Справка: [Twilio Verify](https://www.twilio.com/docs/verify/api), [Primary Compliance Profile](https://www.twilio.com/docs/trust-hub/profiles/primary-compliance-profiles), [Consent and opt-in](https://www.twilio.com/docs/verify/consent-opt-in), [Verification templates](https://www.twilio.com/docs/verify/verification-templates), [Fraud prevention](https://www.twilio.com/docs/verify/preventing-toll-fraud), [US A2P 10DLC](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc).

## Критерии готовности wireframe

- Happy path проходит для Pickup и Delivery: review → OTP → подпись водителя → locked eBOL/POD.
- При выбранном SMS code до успешного OTP кнопка перехода к подписи заблокирована.
- Invalid, expired, delivery error, offline и lock after 3 attempts доступны для показа.
- Рабочие экраны не содержат demo/mock-пояснений; код и переключатели сценариев находятся только в Administration.
- POD не раскрывает полный телефон или OTP.
