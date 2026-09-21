# Документация Mobile App

Zaberman Mobile App — бизнес-прототип для фиксации груза при Pickup, проверки при Dropoff и учёта отдельных грузовых мест при Interstate. Основная навигация: Home, Tasks, Scan и More. Действия с маршрутом, фото, подписями, печатью и синхронизацией сейчас имитируются локально в браузере; это не production-система.

## Порядок чтения

1. [Краткое руководство](quick-start.md) — первые действия и короткие сценарии Pickup/Dropoff.
2. [Руководство пользователя](user-guide.md) — экраны, действия и ошибки.
3. [Бизнес-обзор](business-overview.md) — сущности, процессы и подтверждённые правила.

## Статьи базы знаний

- [Начало работы](../../../knowledge-base/mobile-app/ru/getting-started.md)
- [Pickup](../../../knowledge-base/mobile-app/ru/pickup.md)
- [Dropoff](../../../knowledge-base/mobile-app/ru/dropoff.md)
- [Same Day](../../../knowledge-base/mobile-app/ru/same-day.md)
- [Сканирование и грузовые места](../../../knowledge-base/mobile-app/ru/scan-and-cargo.md)
- [Interstate и BOL](../../../knowledge-base/mobile-app/ru/interstate-and-bol.md)

[English version](../README.md)

## Границы и проверка

Документы описывают активные маршруты [App.tsx](../../../wireframe/src/App.tsx), подключённые экраны и доменную логику. Принятые решения из [Stage 0](../../system-report/STAGE_0_PRODUCT_DECISIONS.md) обозначены как целевая модель, если активный интерфейс их ещё не выполняет. Старые компоненты, не подключённые к роутеру, не являются инструкцией для пользователя.

**Реализовано** — интерактивное поведение в браузере; **симуляция** — изменение локальных mock-данных; **планируется** — подтверждённая целевая модель без активного сценария; **неизвестно** — поведение нельзя надёжно установить из доступных источников.

Развёрнутая версия проверена в Chrome при ширине 390 px: Home → Tasks → Scan → More, Pickup → Dropoff → POD, поиск Scan, Interstate loading → Trip/BOL и приёмка с недостающими местами. На этих путях не возникло ошибок JavaScript. Скриншоты в руководстве сделаны с развёрнутого прототипа.
