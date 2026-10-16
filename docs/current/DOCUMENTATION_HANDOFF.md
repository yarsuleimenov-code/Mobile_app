# Подготовка технической документации

> **Уточнение owner о формате работы:** Текущий результат — конкретное пошаговое задание команде разработки. Получение доступов, проверка API/оборудования и технические исследования выполняются командой в ходе реализации и не являются условиями завершения или передачи ТЗ. Вопросы RQ/OQ уточняются по мере возникновения; до ответа используется только явно отмеченная рекомендуемая основа без подмены её утверждённым решением. Если вопрос затрагивает конкретную операцию, команда согласует этот участок с owner, продолжая независимые работы.

Срез: 2026-10-16. Получатели — аналитик, архитектор, leads разработки и QA. Первоначальный результат синхронизации — baseline и карта источников. После согласования BD подготовлены обновлённое ТЗ, architecture draft и план зависимостей; delivery estimates не разработаны.

**Точка входа для разработчиков:** [DEVELOPMENT_HANDOFF.md](../DEVELOPMENT_HANDOFF.md), пакет ТЗ v1.0. Этот документ сохраняет карту первоисточников и историю подготовки; для начала работы повторять аудит не требуется.

## Актуальное состояние пакетов после BD

A: [ТЗ Draft 1.2](../requirements/TECHNICAL_SPECIFICATION.md) — 70 FR/NFR, 140 AC, обновлённая RTM; [scope и согласования](../requirements/RELEASE_1_DECISIONS.md). B: [System Architecture & Integrations Draft 0.1](../architecture/SYSTEM_ARCHITECTURE_AND_INTEGRATIONS.md) — logical boundaries, ownership, INT-01–07. C: [Development Plan Draft 0.2](../requirements/DEVELOPMENT_PLAN.md) — 10 этапов/dependencies без дат/оценок. Следующий результат: пошаговое задание для передачи разработчикам. Spoke contract pack и уточнения RQ-01–04 — задачи команды в ходе реализации. Финальная приёмка документов/stack/API ещё не выполнена.

## Исходный рекомендованный состав следующего этапа

| Пакет и будущий путь | Что подготовить | Откуда начинать | Что требует решения |
|---|---|---|---|
| A: `docs/requirements/TECHNICAL_SPECIFICATION.md` | Scope/actors, FR, workflows, business rules, validation, offline matrix, errors, acceptance criteria; отдельные IDs требований | [Baseline](../PROJECT_BASELINE.md), user guide, decision log, active screens/domain/tests | OQ-01–09, 11–12: production scope и политики |
| B: `docs/architecture/SYSTEM_ARCHITECTURE_AND_INTEGRATIONS.md` | Components/boundaries, data flow, сущности, SoR/field ownership, API, sync/conflicts, offline/online, external dependencies, NFR/security | Baseline, Stage 0, POC OpenAPI/SQL, старые design references | OQ-02–03, 05–11, 13: выбор технологий/контрактов; не считать старые рекомендации окончательными |
| C: `docs/requirements/DEVELOPMENT_PLAN.md` | Этапы/модули, dependencies, backend/mobile/integrations/infrastructure/QA/rollout, критерии входа/выхода, ответственность | Утверждённые A/B и [аудит](REPOSITORY_AUDIT.md) | OQ-10, 14–15: runtime POC gate, передача evidence, оценки и ресурсы |

Изначально пути были рекомендацией; после поручения owner пакеты A/B/C созданы как draft. При необходимости большие матрицы выделяются после появления содержания. Старые demo-этапы 1–7 не переносить в Development Plan как план production-разработки.

## Карта источников для дальнейшей работы

| Тема | AS-IS evidence в `wireframe/src/` | Поддерживающая документация |
|---|---|---|
| Navigation, Home/Tasks | `App.tsx`, `main.tsx`, `CargoHomeScreen`, `TasksScreen`, `spokeDomain` | Baseline routes, RU/EN quick-start |
| Pickup/Supplemental | `PickupCaptureScreen`, `pickupDraftDomain/Store`, `cargoDomain`, `pickupReviewState` | Stage 2, Stage 6, Stage 0 |
| Dropoff/eBOL/POD | `DropoffVerifyScreen`, `orderEbolDomain/Store`, `orderDocumentDomain`, signing screens | BOL log, Stage 5, handoff comments, OTP, email copy |
| Photos/offline | `PhotoEvidence`, `photoEvidenceDomain`, `useEvidenceSync`, stores | Stage 3; cold-start/sync ограничения в baseline |
| Labels/Scan/Cargo | `placeLabelsDomain`, `placeScanDomain`, `cargoPlaceTracking`, `labelPrintStore` | Stage 4, scan-and-cargo KB; barcode research — только input |
| Interstate | `interstateDomain/Store`, активные Interstate screens | KB Interstate/BOL, legacy audit отдельно от Mobile AS-IS |
| Movement/Branch/roles | `domain.ts`, `cargoDomain`, `orderDetailsDomain`, `prototypeScenarioStore` | Stage 0 PD-012/014/permissions; расхождения в аудите |
| Inspections/contacts/communications | inspection domains/store, `teamContactsDomain`, `orderRequirements`, `communicationDomain/Store` | Feature records в system-report |
| API/data POC | `backend/openapi.yaml`, `backend/src/cargo/`, две SQL migrations | Backend/DB README и Stage 1; runtime не подтверждён |

`screens/` в таблице опущен для краткости имён экранов. Полный состав — [inventory](REPOSITORY_INVENTORY.md).

## Задачи команды при реализации и приёмке

- Зафиксировать исходный commit/версию требований; приложить baseline, decisions и список unresolved OQ. Само наличие прототипа не закрывает production acceptance criteria.
- Для каждого требования связать workflow → screen/domain rule → принятое решение → acceptance criteria; отдельно отметить имитации и новые production requirements.
- Для каждой внешней связи определить owner/master, ID/mapping, направление, payload/version, auth, frequency, offline/retry/conflict policy и ответственного за контракт. Не придумывать API недоступной системы.
- Получить пакет A/B/C, оценить и декомпозировать задачи. Технические решения/API/hardware уточнять по мере разработки; они не являются предварительным условием передачи ТЗ.
- Перед использованием POC применить migrations и прогнать integration test на disposable PostgreSQL `*_test`; затем отдельно проверить RLS/constraints/history. Непройденный runtime gate не блокирует написание документов.
- Передать локальный legacy audit/DOCX по решению OQ-14; clean clone их не содержит. Не включать пользовательские данные, credentials или внутренние Open Questions в public help site автоматически.
- Сохранить UI-reference без перепроектирования. Любое предложенное отличие вынести в decision/change request с подтверждением owner.

Проверки текущего состояния и их ограничения находятся в [REPOSITORY_AUDIT.md](REPOSITORY_AUDIT.md), неизвестные решения — в baseline. Следующему этапу потребуется уточнение внешних контрактов и бизнес-решений, а не повторный поиск назначения локальных файлов.
