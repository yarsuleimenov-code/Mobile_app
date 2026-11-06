# Текущее техническое состояние

Актуализировано **2026-11-06**. Исторический срез от 2026-10-16 зафиксирован в commit `1abe03ce0cd54697dedf713a0657c5f41f69ece3`.

Текущее состояние описано в [PROJECT_BASELINE](../PROJECT_BASELINE.md) и дополнении [Pickup и Delivery — шаги 1–7](../requirements/PICKUP_DELIVERY_PROTOTYPE_INCREMENT_2026_11_06.md). Приёмка исходного среза подтверждена owner 2026-10-16.

## Реализованные контуры

Актуализация коммуникаций 2026-11-02 поверх исторического среза выше: COM-001 (`0c948b4`) — Inbox / Messages / Calls, локальная история и перезвон; COM-002 (`a524ea0`) — первый шаблон We'll be there in 20 minutes с редактированием перед Send. [ТЗ](../requirements/TECHNICAL_SPECIFICATION.md#fr-044), [модель звонков](../system-analysis/CALLS_BEHAVIOR_AND_DATA.md). Это сверка документации с принятым кодом, не повторная приёмка остальных контуров.

| Контур | Факт | Граница |
|---|---|---|
| Wireframe | React/Vite + HashRouter; Home, Tasks, Scan, Inbox, More; Pickup/Delivery с ходом работы по остановкам, Order Details, Packing photos, осмотры, eBOL/POD, Cargo/labels, Interstate, Messages / Calls и quick texts | Fixtures и browser localStorage; без production identity, real sync/media/OTP/SMS/email/printer API |
| Documentation site | Markdown RU/EN + knowledge-base → prepare-docs → VitePress → dist/help; Pages workflow | Только пользовательский help; внутренние audit/decisions/research автоматически не публикуются в help |
| Backend POC | NestJS POST /api/cargo-places: permission, validation, idempotency, transaction/events/outbox | Development actor adapter; не вызывается wireframe; не готовый deployed backend |
| SQL POC | 001_initial_schema.sql и optional 002_api_context_rls.sql | Нет подтверждения runtime migrations, RLS и production grants |

Полная карта routes, сущностей/связей, scope и Open Questions находится в baseline. Точные файлы/назначение — в [inventory](../current/REPOSITORY_INVENTORY.md).

## Где проверять факты

- [App.tsx](../../wireframe/src/App.tsx), [main.tsx](../../wireframe/src/main.tsx): активные routes и providers.
- [cargoDomain](../../wireframe/src/cargoDomain.ts), [cargoStore](../../wireframe/src/cargoStore.tsx), [spokeDomain](../../wireframe/src/spokeDomain.ts): records, группы, места, Branch и route fixtures.
- [orderEbolDomain](../../wireframe/src/orderEbolDomain.ts), [pickupDraftDomain](../../wireframe/src/pickupDraftDomain.ts), [interstateDomain](../../wireframe/src/interstateDomain.ts): переходы и ограничения процессов.
- [Frontend package](../../wireframe/package.json), [Backend package](../../backend/package.json), lockfiles: команды/версии; [OpenAPI](../../backend/openapi.yaml), [DDL](../../database/postgres/README.md): отдельный технический POC.
- [Decision log](../decisions/DECISION_LOG.md): подтверждённые продуктовые правила. [Architecture](ARCHITECTURE.md), [System analysis](SYSTEM_ANALYSIS.md), [Stack](TECHNOLOGY_STACK.md), [DB schema](DATABASE_SCHEMA.md): design references; не окончательная архитектура.

## Отличия AS-IS и целевых правил

Same Day/RouteRun не имеет активного самостоятельного flow; старые компоненты не подключены к router. Active CargoRecord не содержит Order-owned movement_type; Interstate eligibility основан на status/origin/destination. Prototype PlaceID читаемый ZB-ORDER-NN и Code 128, POC/PD-009 — UUIDv7 с versioned payload. Branch selector содержит шесть значений, а старая матрица описывала NJ1 ↔ CA1/CA2. Offline — локальная демонстрация уже загруженного приложения; server Close/sync отсутствуют. Подробная классификация — [аудит](../current/REPOSITORY_AUDIT.md).

## Проверки и история

Актуальные команды, результаты и ограничения проверки — [REPOSITORY_AUDIT](../current/REPOSITORY_AUDIT.md). Исторические результаты не подменяют свежие проверки. [Предыдущий CURRENT_STATE](../archive/CURRENT_STATE_BEFORE_2026_10_16.md) сохранён с прежней историей коммитов, UI-итераций и подтверждений. Статус «нужен просмотр owner» в старых материалах заменён текущим подтверждением CEO, без ретроспективного изменения этапных evidence.

Следующий шаг — [три пакета документации](../current/DOCUMENTATION_HANDOFF.md); production implementation не начата этой синхронизацией.
