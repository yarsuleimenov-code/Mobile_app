# Инвентарь репозитория

Срез 2026-10-16. Каталог назначений 256 проектных файлов, включая локальные ignored evidence. `.git`, dependencies, build outputs, generated VitePress content/cache и tsbuildinfo не являются исходниками и перечислены группами ниже. Результат не подтверждает актуальность внешних систем.

## Директории и generated материалы

| Путь | Назначение | Обработка |
|---|---|---|
| `.github/` | Pages CI | Сохранён |
| `wireframe/src/` | Активный прототип, domain/stores, tests, legacy components | Без изменений |
| `wireframe/public/` | Runtime logo и mock photos | Сохранены |
| `wireframe/design/` | Concept references | Review, не удалять автоматически |
| `wireframe/docs-site/` | VitePress config/theme и generated content | Редактировать только исходные Markdown; сборка регенерирует content |
| `backend/` | Отдельный NestJS POC | Без изменений |
| `database/postgres/` | SQL POC migrations | Без изменений |
| `docs/`, `knowledge-base/` | Внутренние документы и исходники публичного help | Статусы в docs/README |
| `zaberman-mobile-app-audit/`, корневые DOCX | Локальная история legacy/исходных требований | Ignored, переносимость требует OQ-14 |
| `*/node_modules/`, `*/dist/`, `.vite/`, `*.tsbuildinfo`, VitePress cache/content | Зависимости, результаты/кэш сборки; backend node_modules/.audit-temp использовался как временный test cache этого аудита и удалён после проверок | Ignored, не источники требований; без ручной очистки |
| `.git/` | Git metadata/history | Не изменялся вручную |

## Файлы

`Tracked` — входил в Git на старте; `Local/new` — новый в этой задаче либо существовавший untracked/ignored (конкретный статус обозначен отдельно).

| Файл | Назначение | Статус | Учёт |
|---|---|---|---|
| [.github/workflows/deploy-pages.yml](../../.github/workflows/deploy-pages.yml) | CI сборка/публикация Pages app+help | CI configuration | Tracked |
| [.gitignore](../../.gitignore) | Project configuration/metadata: .gitignore | Configuration | Tracked |
| [AGENTS.md](../../AGENTS.md) | Project working rules | Current / supporting | Tracked |
| [BOL_DECISION_LOG.md](../../BOL_DECISION_LOG.md) | BOL decision log | Decision source | Tracked |
| [README.md](../../README.md) | Zaberman Mobile App | Current / supporting | Local/new |
| [WIREFRAME_IMPLEMENTATION_PLAN.md](../../WIREFRAME_IMPLEMENTATION_PLAN.md) | План реализации mobile-first wireframe Zaberman | Historical | Tracked |
| [backend/.env.example](../../backend/.env.example) | Project configuration/metadata: .env.example | Configuration | Tracked |
| [backend/.gitignore](../../backend/.gitignore) | Project configuration/metadata: .gitignore | Configuration | Tracked |
| [backend/README.md](../../backend/README.md) | Zaberman backend — Stage 1 | Current / supporting | Tracked |
| [backend/openapi.yaml](../../backend/openapi.yaml) | Контракт Create CargoPlace POC | POC contract | Tracked |
| [backend/package.json](../../backend/package.json) | Project configuration/metadata: package.json | Configuration | Tracked |
| [backend/pnpm-lock.yaml](../../backend/pnpm-lock.yaml) | Project configuration/metadata: pnpm-lock.yaml | Configuration | Tracked |
| [backend/pnpm-workspace.yaml](../../backend/pnpm-workspace.yaml) | Project configuration/metadata: pnpm-workspace.yaml | Configuration | Tracked |
| [backend/src/app.module.ts](../../backend/src/app.module.ts) | Create CargoPlace/health/DB POC: app.module.ts | POC | Tracked |
| [backend/src/cargo/canonical-json.ts](../../backend/src/cargo/canonical-json.ts) | Create CargoPlace/health/DB POC: canonical-json.ts | POC | Tracked |
| [backend/src/cargo/cargo-place.repository.ts](../../backend/src/cargo/cargo-place.repository.ts) | Create CargoPlace/health/DB POC: cargo-place.repository.ts | POC | Tracked |
| [backend/src/cargo/cargo.controller.ts](../../backend/src/cargo/cargo.controller.ts) | Create CargoPlace/health/DB POC: cargo.controller.ts | POC | Tracked |
| [backend/src/cargo/cargo.module.ts](../../backend/src/cargo/cargo.module.ts) | Create CargoPlace/health/DB POC: cargo.module.ts | POC | Tracked |
| [backend/src/cargo/command-context.provider.ts](../../backend/src/cargo/command-context.provider.ts) | Create CargoPlace/health/DB POC: command-context.provider.ts | POC | Tracked |
| [backend/src/cargo/create-cargo-place.integration.spec.ts](../../backend/src/cargo/create-cargo-place.integration.spec.ts) | Проверки POC: create-cargo-place.integration.spec.ts | Tests / DB conditional | Tracked |
| [backend/src/cargo/create-cargo-place.service.spec.ts](../../backend/src/cargo/create-cargo-place.service.spec.ts) | Проверки POC: create-cargo-place.service.spec.ts | Tests / DB conditional | Tracked |
| [backend/src/cargo/create-cargo-place.service.ts](../../backend/src/cargo/create-cargo-place.service.ts) | Create CargoPlace/health/DB POC: create-cargo-place.service.ts | POC | Tracked |
| [backend/src/cargo/domain-error.ts](../../backend/src/cargo/domain-error.ts) | Create CargoPlace/health/DB POC: domain-error.ts | POC | Tracked |
| [backend/src/cargo/postgres-cargo-place.repository.ts](../../backend/src/cargo/postgres-cargo-place.repository.ts) | Create CargoPlace/health/DB POC: postgres-cargo-place.repository.ts | POC | Tracked |
| [backend/src/cargo/types.ts](../../backend/src/cargo/types.ts) | Create CargoPlace/health/DB POC: types.ts | POC | Tracked |
| [backend/src/cargo/uuid-v7.ts](../../backend/src/cargo/uuid-v7.ts) | Create CargoPlace/health/DB POC: uuid-v7.ts | POC | Tracked |
| [backend/src/cargo/validation.spec.ts](../../backend/src/cargo/validation.spec.ts) | Проверки POC: validation.spec.ts | Tests / DB conditional | Tracked |
| [backend/src/cargo/validation.ts](../../backend/src/cargo/validation.ts) | Create CargoPlace/health/DB POC: validation.ts | POC | Tracked |
| [backend/src/database/postgres.service.ts](../../backend/src/database/postgres.service.ts) | Create CargoPlace/health/DB POC: postgres.service.ts | POC | Tracked |
| [backend/src/health.controller.ts](../../backend/src/health.controller.ts) | Create CargoPlace/health/DB POC: health.controller.ts | POC | Tracked |
| [backend/src/main.ts](../../backend/src/main.ts) | Create CargoPlace/health/DB POC: main.ts | POC | Tracked |
| [backend/tsconfig.build.json](../../backend/tsconfig.build.json) | Project configuration/metadata: tsconfig.build.json | Configuration | Tracked |
| [backend/tsconfig.json](../../backend/tsconfig.json) | Project configuration/metadata: tsconfig.json | Configuration | Tracked |
| [database/postgres/001_initial_schema.sql](../../database/postgres/001_initial_schema.sql) | DDL schema, constraints, views/history | POC / runtime unverified | Tracked |
| [database/postgres/002_api_context_rls.sql](../../database/postgres/002_api_context_rls.sql) | DDL optional branch read-only RLS | POC / runtime unverified | Tracked |
| [database/postgres/README.md](../../database/postgres/README.md) | PostgreSQL schema | Current / supporting | Tracked |
| [docs/PROJECT_BASELINE.md](../../docs/PROJECT_BASELINE.md) | Project baseline | Current / supporting | Local/new |
| [docs/README.md](../../docs/README.md) | Документация Mobile App | Current / supporting | Local/new |
| [docs/archive/CURRENT_STATE_BEFORE_2026_10_16.md](../../docs/archive/CURRENT_STATE_BEFORE_2026_10_16.md) | Реализованный контекст проекта | Historical snapshot | Local/new |
| [docs/current/DOCUMENTATION_HANDOFF.md](../../docs/current/DOCUMENTATION_HANDOFF.md) | Подготовка технической документации | Current / supporting | Local/new |
| [docs/decisions/DECISION_LOG.md](../../docs/decisions/DECISION_LOG.md) | Decision log | Current / supporting | Local/new |
| [docs/mobile-app/README.md](../../docs/mobile-app/README.md) | Mobile App documentation | Current / supporting | Tracked |
| [docs/mobile-app/business-overview.md](../../docs/mobile-app/business-overview.md) | Business overview | Current / supporting | Tracked |
| [docs/mobile-app/images/dropoff.png](../../docs/mobile-app/images/dropoff.png) | Иллюстрация пользовательской документации | Published help / review freshness | Tracked |
| [docs/mobile-app/images/home.png](../../docs/mobile-app/images/home.png) | Иллюстрация пользовательской документации | Published help / review freshness | Tracked |
| [docs/mobile-app/images/interstate.png](../../docs/mobile-app/images/interstate.png) | Иллюстрация пользовательской документации | Published help / review freshness | Tracked |
| [docs/mobile-app/images/pickup-review.png](../../docs/mobile-app/images/pickup-review.png) | Иллюстрация пользовательской документации | Published help / review freshness | Tracked |
| [docs/mobile-app/images/pickup.png](../../docs/mobile-app/images/pickup.png) | Иллюстрация пользовательской документации | Published help / review freshness | Tracked |
| [docs/mobile-app/images/scan.png](../../docs/mobile-app/images/scan.png) | Иллюстрация пользовательской документации | Published help / review freshness | Tracked |
| [docs/mobile-app/images/tasks.png](../../docs/mobile-app/images/tasks.png) | Иллюстрация пользовательской документации | Published help / review freshness | Tracked |
| [docs/mobile-app/open-questions.md](../../docs/mobile-app/open-questions.md) | Open questions and verification limits | Local supporting / ignored | Local/new |
| [docs/mobile-app/quick-start.md](../../docs/mobile-app/quick-start.md) | Quick Start | Current / supporting | Tracked |
| [docs/mobile-app/ru/README.md](../../docs/mobile-app/ru/README.md) | Документация Mobile App | Current / supporting | Tracked |
| [docs/mobile-app/ru/business-overview.md](../../docs/mobile-app/ru/business-overview.md) | Бизнес-обзор | Current / supporting | Tracked |
| [docs/mobile-app/ru/open-questions.md](../../docs/mobile-app/ru/open-questions.md) | Открытые бизнес-вопросы | Local supporting / ignored | Local/new |
| [docs/mobile-app/ru/quick-start.md](../../docs/mobile-app/ru/quick-start.md) | Краткое руководство | Current / supporting | Tracked |
| [docs/mobile-app/ru/user-guide.md](../../docs/mobile-app/ru/user-guide.md) | Руководство пользователя | Current / supporting | Tracked |
| [docs/mobile-app/user-guide.md](../../docs/mobile-app/user-guide.md) | User guide | Current / supporting | Tracked |
| [docs/mobile-ui-ux-audit-prototype.html](../../docs/mobile-ui-ux-audit-prototype.html) | Представление отчёта/исторический UI concept | Research / historical | Tracked |
| [docs/mobile-ui-ux-audit.md](../../docs/mobile-ui-ux-audit.md) | Zaberman Mobile App — UI/UX audit | Historical | Tracked |
| [docs/mobile-ui-ux-employee-workflow.html](../../docs/mobile-ui-ux-employee-workflow.html) | Представление отчёта/исторический UI concept | Research / historical | Tracked |
| [docs/mobile-ui-ux-p1-backlog.md](../../docs/mobile-ui-ux-p1-backlog.md) | Zaberman Mobile App — минимальный P1 implementation backlog | Historical | Tracked |
| [docs/system-report/ARCHITECTURE.md](../../docs/system-report/ARCHITECTURE.md) | Целевая архитектура и схемы Zaberman Mobile | Design reference | Tracked |
| [docs/system-report/BARCODE_PROJECT_START_PROMPT.md](../../docs/system-report/BARCODE_PROJECT_START_PROMPT.md) | Промпт для старта отдельного проекта штрихкодирования Zaberman | Research / separate project | Local/new |
| [docs/system-report/BARCODE_SOLUTIONS_RESEARCH_2026_10_12.html](../../docs/system-report/BARCODE_SOLUTIONS_RESEARCH_2026_10_12.html) | Представление отчёта/исторический UI concept | Research / historical | Local/new |
| [docs/system-report/BARCODE_SOLUTIONS_RESEARCH_2026_10_12.md](../../docs/system-report/BARCODE_SOLUTIONS_RESEARCH_2026_10_12.md) | Исследование решений для штрихкодирования грузовых мест Zaberman | Research / separate project | Local/new |
| [docs/system-report/BA_WEEKLY_2026_10_05_MOBILE_PLAN.md](../../docs/system-report/BA_WEEKLY_2026_10_05_MOBILE_PLAN.md) | BA weekly 2026-10-05 — план доработки мобильного прототипа | Historical | Tracked |
| [docs/system-report/CURRENT_STATE.md](../../docs/system-report/CURRENT_STATE.md) | Текущее техническое состояние | Current / supporting | Tracked |
| [docs/system-report/DATABASE_SCHEMA.md](../../docs/system-report/DATABASE_SCHEMA.md) | Схема базы данных | Design reference | Tracked |
| [docs/system-report/DELIVERY_OTP_WIREFRAME.md](../../docs/system-report/DELIVERY_OTP_WIREFRAME.md) | MOB — подтверждение передачи OTP | Current / supporting | Tracked |
| [docs/system-report/DOCUMENTATION_SITE_IMPLEMENTATION.md](../../docs/system-report/DOCUMENTATION_SITE_IMPLEMENTATION.md) | Публикация пользовательской документации | Current / supporting | Tracked |
| [docs/system-report/EXTERNAL_NAVIGATION_WIREFRAME.md](../../docs/system-report/EXTERNAL_NAVIGATION_WIREFRAME.md) | MOB — Внешняя навигация | Current / supporting | Tracked |
| [docs/system-report/HANDOFF_COMMENTS_SIGNING_WIREFRAME.md](../../docs/system-report/HANDOFF_COMMENTS_SIGNING_WIREFRAME.md) | Комментарии на экране каждой стороны | Current / supporting | Tracked |
| [docs/system-report/OWNER_DEMO_PLAN.md](../../docs/system-report/OWNER_DEMO_PLAN.md) | Этапы 3–7: hi-fi wireframe для демонстрации owner | Historical | Tracked |
| [docs/system-report/PICKUP_EMAIL_COPY_WIREFRAME.md](../../docs/system-report/PICKUP_EMAIL_COPY_WIREFRAME.md) | Email-копия Pickup eBOL: wireframe | Current / supporting | Tracked |
| [docs/system-report/POST_TRIP_INSPECTION_WIREFRAME.md](../../docs/system-report/POST_TRIP_INSPECTION_WIREFRAME.md) | MOB — Post-trip inspection | Current / supporting | Tracked |
| [docs/system-report/PRE_TRIP_INSPECTION_WIREFRAME.md](../../docs/system-report/PRE_TRIP_INSPECTION_WIREFRAME.md) | MOB — Предрейсовый осмотр | Current / supporting | Tracked |
| [docs/system-report/README.md](../../docs/system-report/README.md) | Технические материалы Mobile App | Current / supporting | Tracked |
| [docs/system-report/SMS_COMMUNICATIONS_PROTOTYPE_PLAN.md](../../docs/system-report/SMS_COMMUNICATIONS_PROTOTYPE_PLAN.md) | SMS-коммуникации с клиентом через корпоративную телефонию | Historical | Tracked |
| [docs/system-report/STAGE_0_PRODUCT_DECISIONS.md](../../docs/system-report/STAGE_0_PRODUCT_DECISIONS.md) | Этап 0. Утверждённые продуктовые решения | Decision source | Tracked |
| [docs/system-report/STAGE_1_CREATE_CARGO_PLACE.md](../../docs/system-report/STAGE_1_CREATE_CARGO_PLACE.md) | Этап 1 — Create CargoPlace vertical slice | Current / supporting | Tracked |
| [docs/system-report/STAGE_2_PICKUP_DRAFT.md](../../docs/system-report/STAGE_2_PICKUP_DRAFT.md) | Этап 2 — Черновик и редактирование Pickup | Historical | Tracked |
| [docs/system-report/STAGE_3_PHOTO_OFFLINE_DEMO.md](../../docs/system-report/STAGE_3_PHOTO_OFFLINE_DEMO.md) | Этап 3. Mock-фото и offline-состояния | Historical | Tracked |
| [docs/system-report/STAGE_4_LABEL_PRINT_DEMO.md](../../docs/system-report/STAGE_4_LABEL_PRINT_DEMO.md) | Этап 4. Labels и выборочная mock-печать | Historical | Tracked |
| [docs/system-report/STAGE_5_EBOL_POD_DEMO.md](../../docs/system-report/STAGE_5_EBOL_POD_DEMO.md) | Этап 5. Комментарии сторон и документы eBOL/POD | Historical | Tracked |
| [docs/system-report/STAGE_6_ORDER_DATA_DEMO.md](../../docs/system-report/STAGE_6_ORDER_DATA_DEMO.md) | Этап 6. Данные заказа и Spoke preview | Historical | Tracked |
| [docs/system-report/STAGE_7_OWNER_DEMO_REHEARSAL.md](../../docs/system-report/STAGE_7_OWNER_DEMO_REHEARSAL.md) | Этап 7. Репетиция owner-demo и UX-полировка | Historical | Tracked |
| [docs/system-report/SYSTEM_ANALYSIS.md](../../docs/system-report/SYSTEM_ANALYSIS.md) | Системный анализ будущего приложения Zaberman Mobile | Design reference | Tracked |
| [docs/system-report/TEAM_CONTACTS_WIREFRAME.md](../../docs/system-report/TEAM_CONTACTS_WIREFRAME.md) | MOB — Team contacts | Current / supporting | Tracked |
| [docs/system-report/TECHNOLOGY_STACK.md](../../docs/system-report/TECHNOLOGY_STACK.md) | Технологический стек Zaberman Mobile | Design reference | Tracked |
| [knowledge-base/mobile-app/dropoff.md](../../knowledge-base/mobile-app/dropoff.md) | How to Complete a Dropoff | Current / supporting | Tracked |
| [knowledge-base/mobile-app/getting-started.md](../../knowledge-base/mobile-app/getting-started.md) | Getting Started with Zaberman Mobile App | Current / supporting | Tracked |
| [knowledge-base/mobile-app/interstate-and-bol.md](../../knowledge-base/mobile-app/interstate-and-bol.md) | Interstate Trips and BOL/eBOL | Current / supporting | Tracked |
| [knowledge-base/mobile-app/pickup.md](../../knowledge-base/mobile-app/pickup.md) | How to Complete a Pickup | Current / supporting | Tracked |
| [knowledge-base/mobile-app/ru/dropoff.md](../../knowledge-base/mobile-app/ru/dropoff.md) | Как выполнить Dropoff | Current / supporting | Tracked |
| [knowledge-base/mobile-app/ru/getting-started.md](../../knowledge-base/mobile-app/ru/getting-started.md) | Начало работы с Zaberman Mobile App | Current / supporting | Tracked |
| [knowledge-base/mobile-app/ru/interstate-and-bol.md](../../knowledge-base/mobile-app/ru/interstate-and-bol.md) | Interstate Trips и BOL/eBOL | Current / supporting | Tracked |
| [knowledge-base/mobile-app/ru/pickup.md](../../knowledge-base/mobile-app/ru/pickup.md) | Как выполнить Pickup | Current / supporting | Tracked |
| [knowledge-base/mobile-app/ru/same-day.md](../../knowledge-base/mobile-app/ru/same-day.md) | Как работает Same Day | Current / supporting | Tracked |
| [knowledge-base/mobile-app/ru/scan-and-cargo.md](../../knowledge-base/mobile-app/ru/scan-and-cargo.md) | Как сканировать и учитывать грузовые места | Current / supporting | Tracked |
| [knowledge-base/mobile-app/same-day.md](../../knowledge-base/mobile-app/same-day.md) | How Same Day Orders Work | Current / supporting | Tracked |
| [knowledge-base/mobile-app/scan-and-cargo.md](../../knowledge-base/mobile-app/scan-and-cargo.md) | How to Scan and Handle Cargo | Current / supporting | Tracked |
| [wireframe/.gitignore](../../wireframe/.gitignore) | Project configuration/metadata: .gitignore | Configuration | Tracked |
| [wireframe/README.md](../../wireframe/README.md) | Zaberman mobile wireframe | Current / supporting | Tracked |
| [wireframe/design/concept-cargo-recording-v2.png](../../wireframe/design/concept-cargo-recording-v2.png) | Image concept прежних UI-итераций | Review / design reference | Tracked |
| [wireframe/design/concept-home-pickup.png](../../wireframe/design/concept-home-pickup.png) | Image concept прежних UI-итераций | Review / design reference | Tracked |
| [wireframe/design/concept-interstate-loading-v3.png](../../wireframe/design/concept-interstate-loading-v3.png) | Image concept прежних UI-итераций | Review / design reference | Tracked |
| [wireframe/docs-site/.vitepress/config.ts](../../wireframe/docs-site/.vitepress/config.ts) | VitePress configuration/theme | Build configuration | Tracked |
| [wireframe/docs-site/.vitepress/theme/custom.css](../../wireframe/docs-site/.vitepress/theme/custom.css) | VitePress configuration/theme | Build configuration | Tracked |
| [wireframe/docs-site/.vitepress/theme/index.ts](../../wireframe/docs-site/.vitepress/theme/index.ts) | VitePress configuration/theme | Build configuration | Tracked |
| [wireframe/index.html](../../wireframe/index.html) | HTML entry Vite: root и bootstrap main.tsx | Runtime entry | Tracked |
| [wireframe/package.json](../../wireframe/package.json) | Project configuration/metadata: package.json | Configuration | Tracked |
| [wireframe/pnpm-lock.yaml](../../wireframe/pnpm-lock.yaml) | Project configuration/metadata: pnpm-lock.yaml | Configuration | Tracked |
| [wireframe/pnpm-workspace.yaml](../../wireframe/pnpm-workspace.yaml) | Project configuration/metadata: pnpm-workspace.yaml | Configuration | Tracked |
| [wireframe/public/mock-cargo-collage.png](../../wireframe/public/mock-cargo-collage.png) | Используемый общий mock photo asset | Runtime asset | Tracked |
| [wireframe/public/zaberman-logo-dark-long.png](../../wireframe/public/zaberman-logo-dark-long.png) | Используемый brand asset | Runtime asset | Tracked |
| [wireframe/scripts/prepare-docs.mjs](../../wireframe/scripts/prepare-docs.mjs) | Подготовка RU/EN help, links/assets, исключение внутренних OQ | Build tooling | Tracked |
| [wireframe/scripts/verify-pages-artifact.mjs](../../wireframe/scripts/verify-pages-artifact.mjs) | Проверка app/help artifact и публичного состава | Build tooling | Tracked |
| [wireframe/src/App.tsx](../../wireframe/src/App.tsx) | Активная карта маршрутов | Runtime | Tracked |
| [wireframe/src/DeliveryOtpVerification.tsx](../../wireframe/src/DeliveryOtpVerification.tsx) | Домен/компонент/helper: Delivery evidence и OTP | Runtime / support | Tracked |
| [wireframe/src/OrderDocumentActions.tsx](../../wireframe/src/OrderDocumentActions.tsx) | Домен/компонент/helper: версии и действия документов | Runtime / support | Tracked |
| [wireframe/src/OrderDocumentHistory.tsx](../../wireframe/src/OrderDocumentHistory.tsx) | Домен/компонент/helper: версии и действия документов | Runtime / support | Tracked |
| [wireframe/src/OrderEvidenceDetails.tsx](../../wireframe/src/OrderEvidenceDetails.tsx) | Домен/компонент/helper: OrderEvidenceDetails | Runtime / support | Tracked |
| [wireframe/src/PhotoEvidence.tsx](../../wireframe/src/PhotoEvidence.tsx) | Домен/компонент/helper: фото metadata и локальная sync queue | Runtime / support | Tracked |
| [wireframe/src/PickupEmailDeliveryStatus.tsx](../../wireframe/src/PickupEmailDeliveryStatus.tsx) | Домен/компонент/helper: Pickup drafts/evidence и Supplemental | Runtime / support | Tracked |
| [wireframe/src/StopNavigation.tsx](../../wireframe/src/StopNavigation.tsx) | Домен/компонент/helper: StopNavigation | Runtime / support | Tracked |
| [wireframe/src/TeamContactsCard.tsx](../../wireframe/src/TeamContactsCard.tsx) | Домен/компонент/helper: контакты и сводка заказа | Runtime / support | Tracked |
| [wireframe/src/brand-logo.tsx](../../wireframe/src/brand-logo.tsx) | Домен/компонент/helper: brand-logo | Runtime / support | Tracked |
| [wireframe/src/cargo-components.tsx](../../wireframe/src/cargo-components.tsx) | Домен/компонент/helper: груз, dimension groups, PlaceID и учёт | Runtime / support | Tracked |
| [wireframe/src/cargo.css](../../wireframe/src/cargo.css) | Стили интерфейса: груз, dimension groups, PlaceID и учёт | Runtime / support | Tracked |
| [wireframe/src/cargoDomain.test.ts](../../wireframe/src/cargoDomain.test.ts) | Автоматические проверки: груз, dimension groups, PlaceID и учёт | Tests | Tracked |
| [wireframe/src/cargoDomain.ts](../../wireframe/src/cargoDomain.ts) | Домен/компонент/helper: груз, dimension groups, PlaceID и учёт | Runtime / support | Tracked |
| [wireframe/src/cargoPlaceTracking.test.ts](../../wireframe/src/cargoPlaceTracking.test.ts) | Автоматические проверки: груз, dimension groups, PlaceID и учёт | Tests | Tracked |
| [wireframe/src/cargoPlaceTracking.ts](../../wireframe/src/cargoPlaceTracking.ts) | Домен/компонент/helper: груз, dimension groups, PlaceID и учёт | Runtime / support | Tracked |
| [wireframe/src/cargoStore.tsx](../../wireframe/src/cargoStore.tsx) | Локальное состояние/persistence: груз, dimension groups, PlaceID и учёт | Runtime / support | Tracked |
| [wireframe/src/communicationDomain.test.ts](../../wireframe/src/communicationDomain.test.ts) | Автоматические проверки: локальная SMS/call переписка | Tests | Tracked |
| [wireframe/src/communicationDomain.ts](../../wireframe/src/communicationDomain.ts) | Домен/компонент/helper: локальная SMS/call переписка | Runtime / support | Tracked |
| [wireframe/src/communicationStore.tsx](../../wireframe/src/communicationStore.tsx) | Локальное состояние/persistence: локальная SMS/call переписка | Runtime / support | Tracked |
| [wireframe/src/components.tsx](../../wireframe/src/components.tsx) | Домен/компонент/helper: components | Runtime / support | Tracked |
| [wireframe/src/data.ts](../../wireframe/src/data.ts) | Домен/компонент/helper: data | Runtime / support | Tracked |
| [wireframe/src/deliveryDraftStore.ts](../../wireframe/src/deliveryDraftStore.ts) | Локальное состояние/persistence: Delivery evidence и OTP | Runtime / support | Tracked |
| [wireframe/src/deliveryEbolDomain.test.ts](../../wireframe/src/deliveryEbolDomain.test.ts) | Автоматические проверки: Delivery evidence и OTP | Tests | Tracked |
| [wireframe/src/deliveryOtpDomain.test.ts](../../wireframe/src/deliveryOtpDomain.test.ts) | Автоматические проверки: Delivery evidence и OTP | Tests | Tracked |
| [wireframe/src/deliveryOtpDomain.ts](../../wireframe/src/deliveryOtpDomain.ts) | Домен/компонент/helper: Delivery evidence и OTP | Runtime / support | Tracked |
| [wireframe/src/demoRehearsal.test.ts](../../wireframe/src/demoRehearsal.test.ts) | Автоматические проверки: сценарии репетиции | Tests | Tracked |
| [wireframe/src/demoRehearsal.ts](../../wireframe/src/demoRehearsal.ts) | Домен/компонент/helper: сценарии репетиции | Runtime / support | Tracked |
| [wireframe/src/documentEmailStore.test.ts](../../wireframe/src/documentEmailStore.test.ts) | Автоматические проверки: локальная email-copy queue | Tests | Tracked |
| [wireframe/src/documentEmailStore.ts](../../wireframe/src/documentEmailStore.ts) | Локальное состояние/persistence: локальная email-copy queue | Runtime / support | Tracked |
| [wireframe/src/domain.ts](../../wireframe/src/domain.ts) | Домен/компонент/helper: domain | Runtime / support | Tracked |
| [wireframe/src/externalNavigationDomain.test.ts](../../wireframe/src/externalNavigationDomain.test.ts) | Автоматические проверки: Google Maps и copy address | Tests | Tracked |
| [wireframe/src/externalNavigationDomain.ts](../../wireframe/src/externalNavigationDomain.ts) | Домен/компонент/helper: Google Maps и copy address | Runtime / support | Tracked |
| [wireframe/src/interstate.css](../../wireframe/src/interstate.css) | Стили интерфейса: Interstate Trip, manifest, загрузка/приёмка | Runtime / support | Tracked |
| [wireframe/src/interstateDomain.test.ts](../../wireframe/src/interstateDomain.test.ts) | Автоматические проверки: Interstate Trip, manifest, загрузка/приёмка | Tests | Tracked |
| [wireframe/src/interstateDomain.ts](../../wireframe/src/interstateDomain.ts) | Домен/компонент/helper: Interstate Trip, manifest, загрузка/приёмка | Runtime / support | Tracked |
| [wireframe/src/interstateStore.tsx](../../wireframe/src/interstateStore.tsx) | Локальное состояние/persistence: Interstate Trip, manifest, загрузка/приёмка | Runtime / support | Tracked |
| [wireframe/src/labelPrint.test.ts](../../wireframe/src/labelPrint.test.ts) | Автоматические проверки: локальные print attempts/reprint | Tests | Tracked |
| [wireframe/src/labelPrintStore.ts](../../wireframe/src/labelPrintStore.ts) | Локальное состояние/persistence: локальные print attempts/reprint | Runtime / support | Tracked |
| [wireframe/src/main.tsx](../../wireframe/src/main.tsx) | Bootstrap, HashRouter, providers и CSS | Runtime | Tracked |
| [wireframe/src/measurementDomain.ts](../../wireframe/src/measurementDomain.ts) | Домен/компонент/helper: неизвестные измерения, quality и итоги | Runtime / support | Tracked |
| [wireframe/src/order-document-components.tsx](../../wireframe/src/order-document-components.tsx) | Домен/компонент/helper: order-document-components | Runtime / support | Tracked |
| [wireframe/src/orderDetails.test.ts](../../wireframe/src/orderDetails.test.ts) | Автоматические проверки: данные заказа и ролевые изменения | Tests | Tracked |
| [wireframe/src/orderDetailsDomain.ts](../../wireframe/src/orderDetailsDomain.ts) | Домен/компонент/helper: данные заказа и ролевые изменения | Runtime / support | Tracked |
| [wireframe/src/orderDocument.test.ts](../../wireframe/src/orderDocument.test.ts) | Автоматические проверки: версии и действия документов | Tests | Tracked |
| [wireframe/src/orderDocumentDomain.ts](../../wireframe/src/orderDocumentDomain.ts) | Домен/компонент/helper: версии и действия документов | Runtime / support | Tracked |
| [wireframe/src/orderEbolDomain.test.ts](../../wireframe/src/orderEbolDomain.test.ts) | Автоматические проверки: lifecycle Order eBOL, snapshots и confirmations | Tests | Tracked |
| [wireframe/src/orderEbolDomain.ts](../../wireframe/src/orderEbolDomain.ts) | Домен/компонент/helper: lifecycle Order eBOL, snapshots и confirmations | Runtime / support | Tracked |
| [wireframe/src/orderEbolNavigation.test.ts](../../wireframe/src/orderEbolNavigation.test.ts) | Автоматические проверки: lifecycle Order eBOL, snapshots и confirmations | Tests | Tracked |
| [wireframe/src/orderEbolNavigation.ts](../../wireframe/src/orderEbolNavigation.ts) | Домен/компонент/helper: lifecycle Order eBOL, snapshots и confirmations | Runtime / support | Tracked |
| [wireframe/src/orderEbolScenario.test.ts](../../wireframe/src/orderEbolScenario.test.ts) | Автоматические проверки: lifecycle Order eBOL, snapshots и confirmations | Tests | Tracked |
| [wireframe/src/orderEbolStore.ts](../../wireframe/src/orderEbolStore.ts) | Локальное состояние/persistence: lifecycle Order eBOL, snapshots и confirmations | Runtime / support | Tracked |
| [wireframe/src/orderPodDomain.test.ts](../../wireframe/src/orderPodDomain.test.ts) | Автоматические проверки: итоговый POD | Tests | Tracked |
| [wireframe/src/orderRequirements.test.ts](../../wireframe/src/orderRequirements.test.ts) | Автоматические проверки: broker Requirements fixtures | Tests | Tracked |
| [wireframe/src/orderRequirements.ts](../../wireframe/src/orderRequirements.ts) | Домен/компонент/helper: broker Requirements fixtures | Runtime / support | Tracked |
| [wireframe/src/orderReviewComments.tsx](../../wireframe/src/orderReviewComments.tsx) | Домен/компонент/helper: orderReviewComments | Runtime / support | Tracked |
| [wireframe/src/photoEvidence.test.ts](../../wireframe/src/photoEvidence.test.ts) | Автоматические проверки: фото metadata и локальная sync queue | Tests | Tracked |
| [wireframe/src/photoEvidenceDomain.ts](../../wireframe/src/photoEvidenceDomain.ts) | Домен/компонент/helper: фото metadata и локальная sync queue | Runtime / support | Tracked |
| [wireframe/src/pickupDemoData.ts](../../wireframe/src/pickupDemoData.ts) | Домен/компонент/helper: Pickup drafts/evidence и Supplemental | Runtime / support | Tracked |
| [wireframe/src/pickupDraftDomain.test.ts](../../wireframe/src/pickupDraftDomain.test.ts) | Автоматические проверки: Pickup drafts/evidence и Supplemental | Tests | Tracked |
| [wireframe/src/pickupDraftDomain.ts](../../wireframe/src/pickupDraftDomain.ts) | Домен/компонент/helper: Pickup drafts/evidence и Supplemental | Runtime / support | Tracked |
| [wireframe/src/pickupDraftStore.ts](../../wireframe/src/pickupDraftStore.ts) | Локальное состояние/persistence: Pickup drafts/evidence и Supplemental | Runtime / support | Tracked |
| [wireframe/src/pickupEbolDomain.test.ts](../../wireframe/src/pickupEbolDomain.test.ts) | Автоматические проверки: Pickup drafts/evidence и Supplemental | Tests | Tracked |
| [wireframe/src/pickupGroups.test.ts](../../wireframe/src/pickupGroups.test.ts) | Автоматические проверки: Pickup drafts/evidence и Supplemental | Tests | Tracked |
| [wireframe/src/pickupOtpEbol.test.ts](../../wireframe/src/pickupOtpEbol.test.ts) | Автоматические проверки: Pickup drafts/evidence и Supplemental | Tests | Tracked |
| [wireframe/src/pickupReviewState.ts](../../wireframe/src/pickupReviewState.ts) | Домен/компонент/helper: Pickup drafts/evidence и Supplemental | Runtime / support | Tracked |
| [wireframe/src/placeLabelsDomain.test.ts](../../wireframe/src/placeLabelsDomain.test.ts) | Автоматические проверки: этикетки и barcode | Tests | Tracked |
| [wireframe/src/placeLabelsDomain.ts](../../wireframe/src/placeLabelsDomain.ts) | Домен/компонент/helper: этикетки и barcode | Runtime / support | Tracked |
| [wireframe/src/placeScanDomain.ts](../../wireframe/src/placeScanDomain.ts) | Домен/компонент/helper: lookup и результаты Scan | Runtime / support | Tracked |
| [wireframe/src/postTripInspectionDomain.test.ts](../../wireframe/src/postTripInspectionDomain.test.ts) | Автоматические проверки: послерейсовый отчёт и цикл | Tests | Tracked |
| [wireframe/src/postTripInspectionDomain.ts](../../wireframe/src/postTripInspectionDomain.ts) | Домен/компонент/helper: послерейсовый отчёт и цикл | Runtime / support | Tracked |
| [wireframe/src/preTripInspectionDomain.test.ts](../../wireframe/src/preTripInspectionDomain.test.ts) | Автоматические проверки: предрейсовый gate, checks и история | Tests | Tracked |
| [wireframe/src/preTripInspectionDomain.ts](../../wireframe/src/preTripInspectionDomain.ts) | Домен/компонент/helper: предрейсовый gate, checks и история | Runtime / support | Tracked |
| [wireframe/src/preTripInspectionStore.tsx](../../wireframe/src/preTripInspectionStore.tsx) | Локальное состояние/persistence: предрейсовый gate, checks и история | Runtime / support | Tracked |
| [wireframe/src/prototypeScenarioStore.tsx](../../wireframe/src/prototypeScenarioStore.tsx) | Локальное состояние/persistence: служебные presets/outcomes | Runtime / support | Tracked |
| [wireframe/src/screens/CargoHomeScreen.tsx](../../wireframe/src/screens/CargoHomeScreen.tsx) | Экран Cargo: назначение уточняется названием файла и active router; CargoHomeScreen — Home, CargoPlacesScreen — список, CargoPlaceScreen — карточка | Runtime / support | Tracked |
| [wireframe/src/screens/CargoPlaceScreen.tsx](../../wireframe/src/screens/CargoPlaceScreen.tsx) | Экран: груз, dimension groups, PlaceID и учёт | Runtime / support | Tracked |
| [wireframe/src/screens/CargoPlacesScreen.tsx](../../wireframe/src/screens/CargoPlacesScreen.tsx) | Экран: груз, dimension groups, PlaceID и учёт | Runtime / support | Tracked |
| [wireframe/src/screens/CommunicationsScreen.tsx](../../wireframe/src/screens/CommunicationsScreen.tsx) | Экран: локальная SMS/call переписка | Runtime / support | Tracked |
| [wireframe/src/screens/DeliveryEbolScreen.tsx](../../wireframe/src/screens/DeliveryEbolScreen.tsx) | Экран: Delivery evidence и OTP | Runtime / support | Tracked |
| [wireframe/src/screens/DeliverySignatureScreen.tsx](../../wireframe/src/screens/DeliverySignatureScreen.tsx) | Экран: Delivery evidence и OTP | Runtime / support | Tracked |
| [wireframe/src/screens/DropoffScreen.tsx](../../wireframe/src/screens/DropoffScreen.tsx) | Legacy implementation, вне активного router; imports требуют учёта перед удалением | Review / retained | Tracked |
| [wireframe/src/screens/DropoffVerifyScreen.tsx](../../wireframe/src/screens/DropoffVerifyScreen.tsx) | Экран: DropoffVerifyScreen | Runtime / support | Tracked |
| [wireframe/src/screens/HomeScreen.tsx](../../wireframe/src/screens/HomeScreen.tsx) | Legacy implementation, вне активного router; imports требуют учёта перед удалением | Review / retained | Tracked |
| [wireframe/src/screens/InterstateBolScreen.tsx](../../wireframe/src/screens/InterstateBolScreen.tsx) | Экран: Interstate Trip, manifest, загрузка/приёмка | Runtime / support | Tracked |
| [wireframe/src/screens/InterstateBolsScreen.tsx](../../wireframe/src/screens/InterstateBolsScreen.tsx) | Экран: Interstate Trip, manifest, загрузка/приёмка | Runtime / support | Tracked |
| [wireframe/src/screens/InterstateLoadingScreen.tsx](../../wireframe/src/screens/InterstateLoadingScreen.tsx) | Экран: Interstate Trip, manifest, загрузка/приёмка | Runtime / support | Tracked |
| [wireframe/src/screens/InterstateReviewScreen.tsx](../../wireframe/src/screens/InterstateReviewScreen.tsx) | Экран: Interstate Trip, manifest, загрузка/приёмка | Runtime / support | Tracked |
| [wireframe/src/screens/InterstateScreen.tsx](../../wireframe/src/screens/InterstateScreen.tsx) | Экран: Interstate Trip, manifest, загрузка/приёмка | Runtime / support | Tracked |
| [wireframe/src/screens/InterstateTripScreen.tsx](../../wireframe/src/screens/InterstateTripScreen.tsx) | Экран: Interstate Trip, manifest, загрузка/приёмка | Runtime / support | Tracked |
| [wireframe/src/screens/InterstateUnloadingScreen.tsx](../../wireframe/src/screens/InterstateUnloadingScreen.tsx) | Экран: Interstate Trip, manifest, загрузка/приёмка | Runtime / support | Tracked |
| [wireframe/src/screens/MoreScreen.tsx](../../wireframe/src/screens/MoreScreen.tsx) | Экран: MoreScreen | Runtime / support | Tracked |
| [wireframe/src/screens/OperationsScreen.tsx](../../wireframe/src/screens/OperationsScreen.tsx) | Legacy implementation, вне активного router; imports требуют учёта перед удалением | Review / retained | Tracked |
| [wireframe/src/screens/OrderCallScreen.tsx](../../wireframe/src/screens/OrderCallScreen.tsx) | Экран: OrderCallScreen | Runtime / support | Tracked |
| [wireframe/src/screens/OrderCommunicationsScreen.tsx](../../wireframe/src/screens/OrderCommunicationsScreen.tsx) | Экран: OrderCommunicationsScreen | Runtime / support | Tracked |
| [wireframe/src/screens/OrderDetailsScreen.tsx](../../wireframe/src/screens/OrderDetailsScreen.tsx) | Экран: данные заказа и ролевые изменения | Runtime / support | Tracked |
| [wireframe/src/screens/OrderDocumentScreen.tsx](../../wireframe/src/screens/OrderDocumentScreen.tsx) | Экран: версии и действия документов | Runtime / support | Tracked |
| [wireframe/src/screens/OrderPodScreen.tsx](../../wireframe/src/screens/OrderPodScreen.tsx) | Экран: итоговый POD | Runtime / support | Tracked |
| [wireframe/src/screens/PickupCaptureScreen.tsx](../../wireframe/src/screens/PickupCaptureScreen.tsx) | Экран: Pickup drafts/evidence и Supplemental | Runtime / support | Tracked |
| [wireframe/src/screens/PickupEbolScreen.tsx](../../wireframe/src/screens/PickupEbolScreen.tsx) | Экран: Pickup drafts/evidence и Supplemental | Runtime / support | Tracked |
| [wireframe/src/screens/PickupScreen.tsx](../../wireframe/src/screens/PickupScreen.tsx) | Legacy implementation, вне активного router; imports требуют учёта перед удалением | Review / retained | Tracked |
| [wireframe/src/screens/PickupSignatureScreen.tsx](../../wireframe/src/screens/PickupSignatureScreen.tsx) | Экран: Pickup drafts/evidence и Supplemental | Runtime / support | Tracked |
| [wireframe/src/screens/PlaceLabelsScreen.tsx](../../wireframe/src/screens/PlaceLabelsScreen.tsx) | Экран: этикетки и barcode | Runtime / support | Tracked |
| [wireframe/src/screens/PostTripInspectionScreen.tsx](../../wireframe/src/screens/PostTripInspectionScreen.tsx) | Экран: послерейсовый отчёт и цикл | Runtime / support | Tracked |
| [wireframe/src/screens/PreTripInspectionScreen.tsx](../../wireframe/src/screens/PreTripInspectionScreen.tsx) | Экран: предрейсовый gate, checks и история | Runtime / support | Tracked |
| [wireframe/src/screens/PrototypeControlsScreen.tsx](../../wireframe/src/screens/PrototypeControlsScreen.tsx) | Экран: PrototypeControlsScreen | Runtime / support | Tracked |
| [wireframe/src/screens/SameDayScreen.tsx](../../wireframe/src/screens/SameDayScreen.tsx) | Legacy implementation, вне активного router; imports требуют учёта перед удалением | Review / retained | Tracked |
| [wireframe/src/screens/ScanScreen.tsx](../../wireframe/src/screens/ScanScreen.tsx) | Экран: ScanScreen | Runtime / support | Tracked |
| [wireframe/src/screens/TasksScreen.tsx](../../wireframe/src/screens/TasksScreen.tsx) | Экран: TasksScreen | Runtime / support | Tracked |
| [wireframe/src/signature-components.tsx](../../wireframe/src/signature-components.tsx) | Домен/компонент/helper: signature-components | Runtime / support | Tracked |
| [wireframe/src/spokeDomain.test.ts](../../wireframe/src/spokeDomain.test.ts) | Автоматические проверки: route/stop fixtures и projection | Tests | Tracked |
| [wireframe/src/spokeDomain.ts](../../wireframe/src/spokeDomain.ts) | Домен/компонент/helper: route/stop fixtures и projection | Runtime / support | Tracked |
| [wireframe/src/store.tsx](../../wireframe/src/store.tsx) | Legacy implementation, вне активного router; imports требуют учёта перед удалением | Review / retained | Tracked |
| [wireframe/src/styles.css](../../wireframe/src/styles.css) | Стили интерфейса: styles | Runtime / support | Tracked |
| [wireframe/src/teamContactsDomain.test.ts](../../wireframe/src/teamContactsDomain.test.ts) | Автоматические проверки: контакты и сводка заказа | Tests | Tracked |
| [wireframe/src/teamContactsDomain.ts](../../wireframe/src/teamContactsDomain.ts) | Домен/компонент/helper: контакты и сводка заказа | Runtime / support | Tracked |
| [wireframe/src/useEvidenceSync.ts](../../wireframe/src/useEvidenceSync.ts) | Домен/компонент/helper: useEvidenceSync | Runtime / support | Tracked |
| [wireframe/src/useTrackedCargoPlaces.ts](../../wireframe/src/useTrackedCargoPlaces.ts) | Домен/компонент/helper: useTrackedCargoPlaces | Runtime / support | Tracked |
| [wireframe/tsconfig.json](../../wireframe/tsconfig.json) | Project configuration/metadata: tsconfig.json | Configuration | Tracked |
| [wireframe/vite.config.ts](../../wireframe/vite.config.ts) | Project configuration/metadata: vite.config.ts | Configuration | Tracked |
| [zaberman-mobile-app-audit/01-system-context.md](../../zaberman-mobile-app-audit/01-system-context.md) | Legacy AS-IS evidence: Границы и схема текущей системы | Local historical / ignored | Local/new |
| [zaberman-mobile-app-audit/README.md](../../zaberman-mobile-app-audit/README.md) | Legacy AS-IS evidence: Контекст AS-IS для мобильного приложения Zaberman | Local historical / ignored | Local/new |
| [zaberman-mobile-app-audit/actions/01-access-and-loading.md](../../zaberman-mobile-app-audit/actions/01-access-and-loading.md) | Legacy AS-IS evidence: Действия: вход, выбор workflow и фиксация загрузки | Local historical / ignored | Local/new |
| [zaberman-mobile-app-audit/actions/02-trip-and-partial-loading.md](../../zaberman-mobile-app-audit/actions/02-trip-and-partial-loading.md) | Legacy AS-IS evidence: Действия: создание рейса и частичная загрузка | Local historical / ignored | Local/new |
| [zaberman-mobile-app-audit/actions/03-unloading-and-discrepancies.md](../../zaberman-mobile-app-audit/actions/03-unloading-and-discrepancies.md) | Legacy AS-IS evidence: Действия: выгрузка рейса и расхождения | Local historical / ignored | Local/new |
| [zaberman-mobile-app-audit/actions/04-bol-generation-and-use.md](../../zaberman-mobile-app-audit/actions/04-bol-generation-and-use.md) | Legacy AS-IS evidence: Действия: формирование и использование Interstate BOL | Local historical / ignored | Local/new |
| [zaberman-mobile-app-audit/gaps-and-risks.md](../../zaberman-mobile-app-audit/gaps-and-risks.md) | Legacy AS-IS evidence: Пробелы, ограничения и риски | Local historical / ignored | Local/new |
| [zaberman-mobile-app-audit/reference/data-contracts.md](../../zaberman-mobile-app-audit/reference/data-contracts.md) | Legacy AS-IS evidence: Контракты данных и статусов | Local historical / ignored | Local/new |
| [zaberman-mobile-app-audit/reference/legacy-bol-template.md](../../zaberman-mobile-app-audit/reference/legacy-bol-template.md) | Legacy AS-IS evidence: Исторический `BOL_interstate.xlsx` | Local historical / ignored | Local/new |
| [zaberman-mobile-app-audit/reference/payload-examples.json](../../zaberman-mobile-app-audit/reference/payload-examples.json) | Legacy AS-IS evidence: примеры legacy payload | Local historical / ignored | Local/new |
| [zaberman-mobile-app-audit/reference/source-map.md](../../zaberman-mobile-app-audit/reference/source-map.md) | Legacy AS-IS evidence: Карта исходного кода | Local historical / ignored | Local/new |
| [zaberman-mobile-app-audit/requirements-coverage.md](../../zaberman-mobile-app-audit/requirements-coverage.md) | Legacy AS-IS evidence: Покрытие требований приложенного ТЗ | Local historical / ignored | Local/new |
| [zaberman-mobile-app-audit/reuse-for-new-app.md](../../zaberman-mobile-app-audit/reuse-for-new-app.md) | Legacy AS-IS evidence: Что использовать при проектировании нового приложения | Local historical / ignored | Local/new |
| [zaberman-mobile-app-audit/verification.md](../../zaberman-mobile-app-audit/verification.md) | Legacy AS-IS evidence: Проверка и границы доказательств | Local historical / ignored | Local/new |
| [ТЗ мобильного приложения.docx](../../%D0%A2%D0%97%20%D0%BC%D0%BE%D0%B1%D0%B8%D0%BB%D1%8C%D0%BD%D0%BE%D0%B3%D0%BE%20%D0%BF%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F.docx) | Историческое исходное задание: аналитический epic Mobile App | Local historical / ignored | Local/new |
| [Техническое задание на реализацию Loading Bot TG.docx](../../%D0%A2%D0%B5%D1%85%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%BE%D0%B5%20%D0%B7%D0%B0%D0%B4%D0%B0%D0%BD%D0%B8%D0%B5%20%D0%BD%D0%B0%20%D1%80%D0%B5%D0%B0%D0%BB%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8E%20Loading%20Bot%20TG.docx) | Историческое исходное задание: Telegram capture / Kommo | Local historical / ignored | Local/new |
| [docs/current/REPOSITORY_AUDIT.md](REPOSITORY_AUDIT.md) | Аудит, cleanup/review, расхождения, результаты проверок | Current | Local/new |
| [docs/current/REPOSITORY_INVENTORY.md](REPOSITORY_INVENTORY.md) | Этот каталог назначений файлов | Current | Local/new |
