# Этап 2 — Черновик и редактирование Pickup

Дата: 2026-09-02

Статус: реализовано в hi-fi wireframe; production-функциональность не добавлялась.

## Scope

- versioned `localStorage` draft и восстановление после reload/reopen;
- ввод через dimension groups: Qty, L/W/H и weight per place; отдельный стабильный prototype PlaceID для каждого места;
- add/edit/delete групп до подписания и журнал изменений; уменьшение Qty сохраняет IDs оставшихся мест, новые места не переиспользуют удалённые IDs текущего draft;
- заполненные mock-шаблоны четырёх Pickup-заявок маршрута; saved draft/record имеет приоритет, `Load demo data` требует подтверждения замены;
- вход в редактирование из Home → Recent Operations;
- запрет редактирования PlaceID из locked version 1;
- Supplemental Pickup после подписи;
- version 2+ с added-place evidence и отдельными contact/driver confirmations;
- исходный Pickup snapshot остаётся неизменным.

Вне scope остаются backend, PostgreSQL, настоящая offline-синхронизация, production audit trail, реальные PDF и юридически значимые подписи.

## Основной сценарий

1. Водитель открывает Pickup или недавнюю операцию.
2. Draft создаётся/восстанавливается автоматически и сохраняется после каждого изменения.
3. До подписи можно добавлять, изменять и удалять dimension groups и их количество; Change history показывает действия. UI-группы вычисляются из мест без дублирования state; старые v1 drafts совместимы.
4. После signing version 1 становится read-only.
5. `Add places · Supplemental Pickup` открывает новый draft только для добавленных мест.
6. Review и signing создают отдельную locked version; signatures относятся только к добавленным PlaceID.
7. Delivery использует объединение PlaceID из original и всех locked supplemental versions.

## Проверка

- Vitest: 14 файлов / 40 тестов passed;
- TypeScript + Vite production build passed;
- domain tests подтверждают demo coverage, group CRUD, quantity/weight/volume, round-trip разных весов групп, restore старых drafts, стабильность PlaceID и неизменность version 1;
- визуальная проверка пользователем выполнена; замечания по пустым заявкам и individual-place UI исправлены;
- rendered QA: локальный production preview `http://127.0.0.1:4173/Mobile_app/`, Chrome headless через bundled Playwright, ширины 320/390/1440 px. In-app Browser недоступен из-за Windows sandbox `setup refresh`; использован разрешённый fallback без изменения пользовательского профиля;
- проверен путь route → prefilled Pickup → group CRUD → autosave/reload → review → contact/driver signatures → Supplemental group → version 2 signatures; исходные evidence и confirmations сохранены;
- дополнительно проверены все четыре mock-шаблона, отмена/подтверждение `Load demo data` и переход между order URL; форма сбрасывает локальное состояние по route key и не показывает данные предыдущего заказа;
- страница не пустая, framework overlay и ошибок приложения нет; единственное предупреждение среды — HTTP 404 необязательного `/favicon.ico`. QA-снимки и скрипт находятся вне репозитория.

## Критерий готовности

В рамках business prototype критерий подтверждён моделью, тестами и браузерным сценарием: заказ исправляется группами без прямого изменения подписанного факта. Реальная камера, mobile device/Safari и production-синхронизация не проверялись и остаются вне scope.
