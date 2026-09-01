# Системный отчёт Zaberman Mobile

Статус: синхронизированный baseline, 2026-09-01.

## Рекомендуемый вывод

Проект находится на стадии интерактивного бизнес-прототипа и первого backend vertical slice. React/Vite wireframe остаётся UX-reference. В рабочем дереве подготовлены PostgreSQL DDL и NestJS-команда `Create CargoPlace`, но migrations ещё не применены к runtime PostgreSQL 16. Production mobile client, production-аутентификация, реальные интеграции, файловое хранилище и надёжный offline-first контур отсутствуют.

Для production рекомендуется cross-platform мобильное приложение на React Native + Expo, локальная SQLite и outbox-синхронизация, модульный backend на TypeScript, PostgreSQL как system of record и S3-совместимое хранилище файлов. Архитектуру следует начинать как модульный монолит; микросервисы на MVP не нужны.

## Состав

- [CURRENT_STATE.md](CURRENT_STATE.md) — фактически реализованный контекст, проверенное состояние, расхождения и рекомендуемый следующий vertical slice.
- [STAGE_0_PRODUCT_DECISIONS.md](STAGE_0_PRODUCT_DECISIONS.md) — утверждённые lifecycle, data, label, permission и signature-решения для следующего этапа.
- [STAGE_1_CREATE_CARGO_PLACE.md](STAGE_1_CREATE_CARGO_PLACE.md) — реализованный API vertical slice, транзакция, проверки и оставшийся runtime gate.
- [STAGE_2_PICKUP_DRAFT.md](STAGE_2_PICKUP_DRAFT.md) — prototype draft/edit flow, locked snapshots и Supplemental Pickup versions.
- [SYSTEM_ANALYSIS.md](SYSTEM_ANALYSIS.md) — текущее состояние, бизнес-контекст, scope, процессы, требования, разрывы, риски и этапы.
- [ARCHITECTURE.md](ARCHITECTURE.md) — контекстная, контейнерная, data и sync-схемы; источники истины и API boundary.
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — PostgreSQL ER-модель, таблицы, инварианты, транзакции, безопасность и rollout.
- [TECHNOLOGY_STACK.md](TECHNOLOGY_STACK.md) — текущие технологии, рекомендуемый production-стек, альтернативы и критерии выбора.

## Основание

Отчёт основан на двух исходных ТЗ, существующем audit-пакете, `WIREFRAME_IMPLEMENTATION_PLAN.md`, `BOL_DECISION_LOG.md` и фактических файлах `wireframe/`. Production deployment прежнего Apps Script, Telegram-бот, реальные Sheets/Drive, Spoke и Kommo в этой сессии не проверялись.

## Как использовать

1. Перед разработкой открыть `CURRENT_STATE.md` и применить утверждённые решения из `STAGE_0_PRODUCT_DECISIONS.md`.
2. Product/Warehouse/Delivery/Dispatching согласуют границы MVP и открытые бизнес-решения из системного анализа.
3. IT подтверждает master systems, identity provider, hosting, retention и printer/scanner парк.
4. Команда запускает подготовленный integration suite на чистом PostgreSQL 16 и закрывает runtime gate первого vertical slice.
5. Wireframe остаётся UX-reference; его `localStorage`-модель и mock-данные не переносятся как production-архитектура.
