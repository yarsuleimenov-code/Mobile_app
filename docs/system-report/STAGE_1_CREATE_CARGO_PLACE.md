# Этап 1 — Create CargoPlace vertical slice

Дата: 2026-09-01

Статус: реализация и локальные проверки завершены; runtime-проверка на PostgreSQL 16 ожидает test database.

## 1. Цель и граница

Минимальный готовый результат — одна идемпотентная серверная команда создаёт физическое место, первичный замер и локально печатаемый alias без подключения wireframe к PostgreSQL.

В scope:

- `POST /api/cargo-places` и OpenAPI-контракт;
- UUIDv7 `operationId`, PlaceID, measurement ID и label ID;
- optimistic check `expectedOrderVersion`;
- `cargo_place.create` в контексте филиала;
- атомарная запись command/place/measurement/label/events/outbox;
- точный replay сохранённого результата.

Вне scope:

- production IdP/JWT adapter;
- мобильный shell, SQLite и sync engine;
- реальная печать, scanner/printer hardware spike;
- Order/Task read API, media и документы.

## 2. Реализованный контракт

Источник: [`backend/openapi.yaml`](../../backend/openapi.yaml).

- Barcode payload строится сервером только как `ZB1:<opaque PlaceID>`.
- Создание alias фиксирует `label_generated`; `label_printed` возникает только после реальной печати в будущем сценарии.
- `complete`, `partial`, `unknown`, `not_measurable` не заменяют отсутствующие значения нулями.
- Для неполных размеров или неизвестного веса обязателен `unknownReason`.
- Повтор того же `operationId` с тем же нормализованным payload и command context возвращает сохранённый `result_payload`.
- Тот же `operationId` с другим hash возвращает `409 idempotency_key_reused` и не изменяет исходный результат.

## 3. Транзакция

Одна PostgreSQL-транзакция:

1. проверяет replay, активного пользователя/филиал, branch capability, Order origin branch и optional device scope;
2. блокирует/проверяет версию Order;
3. создаёт `command_requests`;
4. создаёт `cargo_places`, `cargo_place_measurements`, `place_label_aliases`;
5. добавляет `place_created` v1, `measurement_recorded` v2, `label_generated` v3;
6. обновляет current measurement/projection до v3;
7. добавляет `cargo_place.created` в outbox;
8. сохраняет точный API result в command и выполняет commit.

## 4. Проверка

- backend TypeScript build: passed;
- compiled NestJS bootstrap + `GET /api/health`: passed;
- Vitest: 2 файла / 10 unit-тестов passed;
- PostgreSQL integration suite: подготовлен, 1 тест skipped без `DATABASE_URL`;
- integration suite отказывается очищать БД, имя которой не заканчивается `_test`;
- SQL migrations всё ещё не применены к реальному PostgreSQL 16 в этой среде.

## 5. Ограничения и следующий gate

Этап нельзя считать runtime-подтверждённым, пока integration suite не выполнен на чистой PostgreSQL 16 test DB. Следующий обязательный шаг — предоставить `DATABASE_URL` на БД `*_test`, выполнить migration + transaction test и только после этого начинать mobile shell/SQLite sync spike.

Development identity adapter получает `DEV_ACTOR_USER_ID`, `DEV_BRANCH_ID` и optional `DEV_DEVICE_ID` из окружения. При `NODE_ENV=production` команда закрыта с `503 auth_adapter_missing`; это намеренная защита до подключения настоящего IdP.
