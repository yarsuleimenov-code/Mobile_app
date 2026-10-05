# Системный отчёт Zaberman Mobile

Статус на 2026-09-30: текущий source и публичная RU/EN документация синхронизированы с обязательным Pre-trip inspection и двумя допустимыми способами подтверждения контакта во всех Pickup/Delivery — подписью на устройстве или OTP. Опубликованный baseline в `main` и история коммитов зафиксированы в [CURRENT_STATE.md](CURRENT_STATE.md). Этапы 3–6 приняты owner; отдельное решение owner по Этапу 7 в проектных документах не зафиксировано.

## Рекомендуемый вывод

Интерактивный hi-fi wireframe служит для согласования процессов с owner. [OWNER_DEMO_PLAN.md](OWNER_DEMO_PLAN.md) и файлы этапов 3–7 сохраняют историю требований и проверок; следующий практический шаг — бизнес-просмотр и решения по внутренним открытым вопросам. PostgreSQL DDL и NestJS `Create CargoPlace` — отдельный технический POC; migrations ещё не проверены на runtime PostgreSQL 16. Production mobile client, аутентификация, реальные интеграции, media storage и надёжный offline-first контур отсутствуют.

Для production рекомендуется cross-platform мобильное приложение на React Native + Expo, локальная SQLite и outbox-синхронизация, модульный backend на TypeScript, PostgreSQL как system of record и S3-совместимое хранилище файлов. Архитектуру следует начинать как модульный монолит; микросервисы на MVP не нужны.

## Состав

- [TEAM_CONTACTS_WIREFRAME.md](TEAM_CONTACTS_WIREFRAME.md) — принятая owner карточка команды заказа, точный контекст остановки, Copy order summary и проверки.
- [HANDOFF_COMMENTS_SIGNING_WIREFRAME.md](HANDOFF_COMMENTS_SIGNING_WIREFRAME.md) — принятый owner перенос комментариев на шаг каждой стороны, сброс подписи/OTP и проверки.
- [POST_TRIP_INSPECTION_WIREFRAME.md](POST_TRIP_INSPECTION_WIREFRAME.md) — принятый owner Post-trip, история пар, новый цикл и границы проверок.
- [BA_WEEKLY_2026_10_05_MOBILE_PLAN.md](BA_WEEKLY_2026_10_05_MOBILE_PLAN.md) — осмотры, комментарии и контакты заказа реализованы и приняты; внешняя навигация — следующая задача.
- [CURRENT_STATE.md](CURRENT_STATE.md) — фактически реализованный контекст, актуальный Git-срез, границы проверки и следующие решения.
- [DOCUMENTATION_SITE_IMPLEMENTATION.md](DOCUMENTATION_SITE_IMPLEMENTATION.md) — целевые URL, критерии готовности, зафиксированная база и правила публикации пользовательской документации вместе с прототипом.
- [Mobile App: руководство на русском](../mobile-app/ru/README.md) и [на английском](../mobile-app/README.md) — бизнес-обзор, пользовательские инструкции, Quick Start и база знаний.
- [OWNER_DEMO_PLAN.md](OWNER_DEMO_PLAN.md) — актуальные этапы 3–7: сценарии, delta, критерии owner-demo и отдельный production-backlog.
- [STAGE_0_PRODUCT_DECISIONS.md](STAGE_0_PRODUCT_DECISIONS.md) — утверждённые lifecycle, data, label, permission и signature-решения для следующего этапа.
- [STAGE_1_CREATE_CARGO_PLACE.md](STAGE_1_CREATE_CARGO_PLACE.md) — реализованный API vertical slice, транзакция, проверки и оставшийся runtime gate.
- [STAGE_2_PICKUP_DRAFT.md](STAGE_2_PICKUP_DRAFT.md) — prototype draft/edit flow, locked snapshots и Supplemental Pickup versions.
- [STAGE_3_PHOTO_OFFLINE_DEMO.md](STAGE_3_PHOTO_OFFLINE_DEMO.md) — mock-фото, категории, очередь/retry/conflict, presets и проверки подписанного evidence.
- [STAGE_4_LABEL_PRINT_DEMO.md](STAGE_4_LABEL_PRINT_DEMO.md) — выборочная печать/reprint, version filter, сохраняемый выбор и контрольный Scan.
- [STAGE_5_EBOL_POD_DEMO.md](STAGE_5_EBOL_POD_DEMO.md) — комментарии сторон, read-only версии, document actions и проверки.
- [STAGE_6_ORDER_DATA_DEMO.md](STAGE_6_ORDER_DATA_DEMO.md) — названия, Qty, Special Cargo, неизвестные измерения, Spoke preview и локальные ролевые правила.
- [STAGE_7_OWNER_DEMO_REHEARSAL.md](STAGE_7_OWNER_DEMO_REHEARSAL.md) — инструкция ведущему, семь пресетов, две репетиции, UX-защиты и ожидаемые решения owner.
- [PICKUP_EMAIL_COPY_WIREFRAME.md](PICKUP_EMAIL_COPY_WIREFRAME.md) — необязательный запрос email-копии подписанной версии Pickup eBOL, локальные статусы и ограничения отправки.
- [PRE_TRIP_INSPECTION_WIREFRAME.md](PRE_TRIP_INSPECTION_WIREFRAME.md) — обязательный осмотр автомобиля, фото, route gate и границы production-реализации.
- [DELIVERY_OTP_WIREFRAME.md](DELIVERY_OTP_WIREFRAME.md) — OTP-подтверждение Pickup/Delivery, демонстрационные правила и production gate для Twilio Verify.
- [SYSTEM_ANALYSIS.md](SYSTEM_ANALYSIS.md) — текущее состояние, бизнес-контекст, scope, процессы, требования, разрывы, риски и этапы.
- [ARCHITECTURE.md](ARCHITECTURE.md) — контекстная, контейнерная, data и sync-схемы; источники истины и API boundary.
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — PostgreSQL ER-модель, таблицы, инварианты, транзакции, безопасность и rollout.
- [TECHNOLOGY_STACK.md](TECHNOLOGY_STACK.md) — текущие технологии, рекомендуемый production-стек, альтернативы и критерии выбора.

## Основание

Отчёт основан на двух исходных ТЗ, существующем audit-пакете, `WIREFRAME_IMPLEMENTATION_PLAN.md`, `BOL_DECISION_LOG.md` и фактических файлах `wireframe/`. Production deployment прежнего Apps Script, Telegram-бот, реальные Sheets/Drive, Spoke и Kommo в этой сессии не проверялись.

## Как использовать

1. Открыть `CURRENT_STATE.md` для AS-IS статуса, затем пользовательскую документацию и `OWNER_DEMO_PLAN.md` как историю demo-этапов.
2. Соблюдать бизнес-инварианты `STAGE_0_PRODUCT_DECISIONS.md`; их production-механизмы не превращать в зависимости wireframe.
3. Согласовать с owner фактические сценарии и приоритетные открытые вопросы. Не путать публикацию кода, бизнес-приёмку и готовность к полевой эксплуатации.
4. Архитектура, стек, DDL/API, IdP, оборудование и production-пилот — отдельный будущий backlog. Его gates не блокируют demo.
5. `localStorage` и mock-данные не переносить как production-архитектуру. Этапы 3–7 и последующие изменения уже находятся в `main`; backend/SQL ими не менялись. Следующий шаг — просмотр owner и фиксация бизнес-решений.
