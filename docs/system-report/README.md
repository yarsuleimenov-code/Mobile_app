# Системный отчёт Zaberman Mobile

Статус на 2026-09-02: этапы 3–4 приняты и опубликованы; Этапы 5–6 приняты owner, их публикация в main разрешена перед Этапом 7.

## Рекомендуемый вывод

Сейчас создаётся интерактивный hi-fi wireframe для демонстрации owner. Дальнейшая работа — по [OWNER_DEMO_PLAN.md](OWNER_DEMO_PLAN.md), этапы 3–7. PostgreSQL DDL и NestJS `Create CargoPlace` сохранены в репозитории как отдельный технический POC; migrations ещё не проверены на runtime PostgreSQL 16. Production mobile client, аутентификация, реальные интеграции, media storage и надёжный offline-first контур отсутствуют и не входят в demo-приёмку.

Для production рекомендуется cross-platform мобильное приложение на React Native + Expo, локальная SQLite и outbox-синхронизация, модульный backend на TypeScript, PostgreSQL как system of record и S3-совместимое хранилище файлов. Архитектуру следует начинать как модульный монолит; микросервисы на MVP не нужны.

## Состав

- [CURRENT_STATE.md](CURRENT_STATE.md) — фактически реализованный контекст, проверенное состояние и следующий demo-этап.
- [OWNER_DEMO_PLAN.md](OWNER_DEMO_PLAN.md) — актуальные этапы 3–7: сценарии, delta, критерии owner-demo и отдельный production-backlog.
- [STAGE_0_PRODUCT_DECISIONS.md](STAGE_0_PRODUCT_DECISIONS.md) — утверждённые lifecycle, data, label, permission и signature-решения для следующего этапа.
- [STAGE_1_CREATE_CARGO_PLACE.md](STAGE_1_CREATE_CARGO_PLACE.md) — реализованный API vertical slice, транзакция, проверки и оставшийся runtime gate.
- [STAGE_2_PICKUP_DRAFT.md](STAGE_2_PICKUP_DRAFT.md) — prototype draft/edit flow, locked snapshots и Supplemental Pickup versions.
- [STAGE_3_PHOTO_OFFLINE_DEMO.md](STAGE_3_PHOTO_OFFLINE_DEMO.md) — mock-фото, категории, очередь/retry/conflict, presets и проверки подписанного evidence.
- [STAGE_4_LABEL_PRINT_DEMO.md](STAGE_4_LABEL_PRINT_DEMO.md) — выборочная печать/reprint, version filter, сохраняемый выбор и контрольный Scan.
- [STAGE_5_EBOL_POD_DEMO.md](STAGE_5_EBOL_POD_DEMO.md) — комментарии сторон, read-only версии, document actions и проверки.
- [STAGE_6_ORDER_DATA_DEMO.md](STAGE_6_ORDER_DATA_DEMO.md) — названия, Qty, Special Cargo, неизвестные измерения, Spoke preview и локальные ролевые правила.
- [SYSTEM_ANALYSIS.md](SYSTEM_ANALYSIS.md) — текущее состояние, бизнес-контекст, scope, процессы, требования, разрывы, риски и этапы.
- [ARCHITECTURE.md](ARCHITECTURE.md) — контекстная, контейнерная, data и sync-схемы; источники истины и API boundary.
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — PostgreSQL ER-модель, таблицы, инварианты, транзакции, безопасность и rollout.
- [TECHNOLOGY_STACK.md](TECHNOLOGY_STACK.md) — текущие технологии, рекомендуемый production-стек, альтернативы и критерии выбора.

## Основание

Отчёт основан на двух исходных ТЗ, существующем audit-пакете, `WIREFRAME_IMPLEMENTATION_PLAN.md`, `BOL_DECISION_LOG.md` и фактических файлах `wireframe/`. Production deployment прежнего Apps Script, Telegram-бот, реальные Sheets/Drive, Spoke и Kommo в этой сессии не проверялись.

## Как использовать

1. Открыть `CURRENT_STATE.md`, затем `OWNER_DEMO_PLAN.md`; следующая работа — только недостающий UX текущего demo-этапа.
2. Соблюдать бизнес-инварианты `STAGE_0_PRODUCT_DECISIONS.md`; их production-механизмы не превращать в зависимости wireframe.
3. Согласовать с owner сценарии и результат показа. Не путать готовность demo с готовностью к полевой эксплуатации.
4. Архитектура, стек, DDL/API, IdP, оборудование и production-пилот — отдельный будущий backlog. Его gates не блокируют demo.
5. `localStorage` и mock-данные не переносить как production-архитектуру. Этапы 3–6 изменили wireframe; backend/SQL не менялись. Следующий этап — 7. Публикация Этапов 5–6 в main разрешена owner.
