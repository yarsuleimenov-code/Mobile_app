# MOB — подтверждение доставки OTP

Дата: 2026-09-28  
Статус: hi-fi wireframe для бизнес-валидации; production-интеграция не реализована.

## Цель и scope

Получатель подтверждает выдачу выбранных заказов одноразовым SMS-кодом. После проверки OTP водитель подписывает Delivery snapshot, затем Order eBOL закрывается и POD показывает факт OTP-проверки.

Минимальный сценарий:

1. На Delivery review приложение показывает зарегистрированного получателя и маскированный номер.
2. Водитель отправляет код; номер нельзя изменить на экране доставки.
3. Получатель сообщает шестизначный код водителю.
4. После успешной проверки доступна подпись водителя.
5. POD хранит способ подтверждения, получателя, последние 4 цифры номера и время; сам OTP не хранится и не показывается.

## Принятые правила

- OTP включается только для заказов, где этот способ обязателен; остальные заказы сохраняют Sign on device / Contactless.
- Код: 6 цифр, срок действия в целевой реализации — 10 минут.
- Максимум 3 попытки ввода. После этого проверка блокируется; дальнейшее решение принимает диспетчер/супервайзер.
- Максимум 3 отправки в рамках handoff.
- Offline не позволяет проверить OTP: показывается ошибка доставки SMS, завершение заблокировано.
- Альтернативный способ подтверждения не выбирается водителем самостоятельно.

## Сценарии Administration

Preset `OTP Delivery`, заказ `#99007008`:

- Success — код `846219`;
- Invalid code — ошибки ввода и блокировка после трёх попыток;
- Expired code — предложение отправить новый код;
- SMS delivery error — повтор или обращение к диспетчеру;
- Offline — SMS delivery error.

Это управляемые состояния wireframe. SMS, webhook и backend-проверка отсутствуют.

## Production gate: Twilio

До передачи функции в production-разработку необходимо отдельно оформить и настроить Twilio:

1. Создать production Twilio account/subaccount и **Verify Service** для OTP; выбрать 6-digit token, срок действия, бренд и шаблоны сообщений.
2. Подтвердить поддерживаемые страны, sender/origination identity и требования регистрации для каждого рынка. Для США отдельно согласовать маршрут с Twilio: при использовании только verification-сообщений рекомендуемый вариант — Twilio Verify; при отправке через Programmable Messaging с 10DLC необходимы Brand/Campaign registration и соответствующие consent/opt-out процессы.
3. Зафиксировать основание получения SMS и текст согласия получателя; проверить локальные требования privacy и messaging compliance.
4. Хранить Twilio credentials только на backend. Мобильный клиент передаёт запрос `send/check`; OTP и секреты не сохраняются в приложении.
5. Сохранять audit-события send/check, verification SID, outcome, actor и timestamps; не логировать полный номер и введённый код.
6. Настроить rate limits, fraud protection, мониторинг delivery failures и операционный процесс supervisor override.

Справка: [Twilio Verify](https://www.twilio.com/docs/verify/api), [Verify Service rate limits](https://www.twilio.com/docs/verify/api/service-rate-limits), [US A2P 10DLC registration](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc).

## Критерии готовности wireframe

- Happy path проходит от Delivery review до completed POD.
- До успешного OTP кнопка перехода к подписи заблокирована.
- Invalid, expired, delivery error, offline и lock after 3 attempts доступны для показа.
- Рабочие экраны не содержат demo/mock-пояснений; код и переключатели сценариев находятся только в Administration.
- POD не раскрывает полный телефон или OTP.

