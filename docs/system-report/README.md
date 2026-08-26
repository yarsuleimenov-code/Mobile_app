# Системный отчёт Zaberman Mobile

Статус: baseline для согласования, 2026-08-26.

## Рекомендуемый вывод

Проект находится на стадии интерактивного бизнес-прототипа. Текущий React/Vite wireframe полезен для согласования Pickup, Dropoff, грузовых мест, Order eBOL/POD и Interstate, но не является основой production-системы: в нём нет backend API, централизованной базы, аутентификации, реальных интеграций, файлового хранилища и надёжного offline-first контура.

Для production рекомендуется cross-platform мобильное приложение на React Native + Expo, локальная SQLite и outbox-синхронизация, модульный backend на TypeScript, PostgreSQL как system of record и S3-совместимое хранилище файлов. Архитектуру следует начинать как модульный монолит; микросервисы на MVP не нужны.

## Состав

- [SYSTEM_ANALYSIS.md](SYSTEM_ANALYSIS.md) — текущее состояние, бизнес-контекст, scope, процессы, требования, разрывы, риски и этапы.
- [ARCHITECTURE.md](ARCHITECTURE.md) — контекстная, контейнерная, data и sync-схемы; источники истины и API boundary.
- [TECHNOLOGY_STACK.md](TECHNOLOGY_STACK.md) — текущие технологии, рекомендуемый production-стек, альтернативы и критерии выбора.

## Основание

Отчёт основан на двух исходных ТЗ, существующем audit-пакете, `WIREFRAME_IMPLEMENTATION_PLAN.md`, `BOL_DECISION_LOG.md` и фактических файлах `wireframe/`. Production deployment прежнего Apps Script, Telegram-бот, реальные Sheets/Drive, Spoke и Kommo в этой сессии не проверялись.

## Как использовать

1. Product/Warehouse/Delivery/Dispatching согласуют границы MVP и открытые бизнес-решения из системного анализа.
2. IT подтверждает master systems, identity provider, hosting, retention и printer/scanner парк.
3. Команда фиксирует решения ADR-документами и только затем создаёт production-проект.
4. Wireframe остаётся UX-reference; его `localStorage`-модель и mock-данные не переносятся как production-архитектура.
