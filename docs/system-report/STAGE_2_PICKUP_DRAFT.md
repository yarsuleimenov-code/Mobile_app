# Этап 2 — Черновик и редактирование Pickup

Дата: 2026-09-01

Статус: реализовано в hi-fi wireframe; production-функциональность не добавлялась.

## Scope

- versioned `localStorage` draft и восстановление после reload/reopen;
- отдельные редактируемые места со стабильным prototype PlaceID;
- add/edit/delete до подписания и журнал изменений;
- вход в редактирование из Home → Recent Operations;
- запрет редактирования PlaceID из locked version 1;
- Supplemental Pickup после подписи;
- version 2+ с added-place evidence и отдельными contact/driver confirmations;
- исходный Pickup snapshot остаётся неизменным.

Вне scope остаются backend, PostgreSQL, настоящая offline-синхронизация, production audit trail, реальные PDF и юридически значимые подписи.

## Основной сценарий

1. Водитель открывает Pickup или недавнюю операцию.
2. Draft создаётся/восстанавливается автоматически и сохраняется после каждого изменения.
3. До подписи можно добавлять, изменять и удалять места; Change history показывает действия.
4. После signing version 1 становится read-only.
5. `Add places · Supplemental Pickup` открывает новый draft только для добавленных мест.
6. Review и signing создают отдельную locked version; signatures относятся только к добавленным PlaceID.
7. Delivery использует объединение PlaceID из original и всех locked supplemental versions.

## Проверка

- Vitest: 13 файлов / 35 тестов passed;
- TypeScript + Vite production build passed;
- domain tests подтверждают restore, CRUD, стабильность PlaceID и неизменность version 1;
- rendered Browser QA не выполнен: Browser runtime трижды завершился из-за Windows sandbox `setup refresh`, до открытия страницы.

## Критерий готовности

В рамках business prototype критерий закрыт на уровне модели и интерактивного сценария: заказ исправляется без прямого изменения подписанного факта. Визуальный Browser acceptance остаётся обязательным повторным gate после восстановления Browser runtime.
