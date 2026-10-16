# Документация Mobile App

Актуальный статус на 2026-10-16: прототип принят CEO; UI/UX и реализованная логика зафиксированы. Phase 2 подготовила полный draft требований и ТЗ; пакет ТЗ v1.0 подготовлен для передачи разработчикам с явно отмеченными уточнениями. Согласованы 12 BD, 3 отложены; требования синхронизированы. Подготовлены логическая архитектура/интеграции и план зависимостей как draft; stack/contracts и остаточные gates открыты. Команде начинать с [DEVELOPMENT_HANDOFF.md](DEVELOPMENT_HANDOFF.md).

Пакет для передачи содержит [конкретное пошаговое задание команде](requirements/DEVELOPMENT_PLAN.md#пошаговое-задание-команде). Доступы и проверки API выполняет команда при разработке; открытые вопросы решаются по мере поступления и не блокируют подготовку/передачу ТЗ.

## Порядок чтения и приоритет источников

1. [DEVELOPMENT_HANDOFF.md](DEVELOPMENT_HANDOFF.md) — пакет v1.0, состав, порядок чтения, первые действия и порядок уточнений.
2. [PROJECT_BASELINE.md](PROJECT_BASELINE.md) — единый актуальный статус, scope, навигация, понятия, ограничения и Open Questions.
3. [DECISION_LOG.md](decisions/DECISION_LOG.md) — подтверждённые решения с первичными источниками; рекомендации отделены от решений.
4. [Техническая сводка](system-report/CURRENT_STATE.md) — где проверять факты в source; [аудит](current/REPOSITORY_AUDIT.md) — расхождения, очистка и результаты проверок; [инвентарь](current/REPOSITORY_INVENTORY.md) — назначение файлов.
5. [Русское руководство](mobile-app/ru/README.md) / [English guide](mobile-app/README.md) и [база знаний](../knowledge-base/mobile-app/getting-started.md) — пользовательские сценарии.
6. [Подготовка следующего этапа](current/DOCUMENTATION_HANDOFF.md) — состав трёх будущих пакетов, источники и условия передачи.
7. [Phase 2: Technical Specification](requirements/TECHNICAL_SPECIFICATION.md) — новый draft требований; сначала ознакомиться с [Gap Analysis](requirements/REQUIREMENTS_GAP_ANALYSIS.md) и [разбором OQ](requirements/OPEN_QUESTIONS_REVIEW.md).

## Phase 2 — Requirements Analysis & Technical Specification

Пакет от 2026-10-16 содержит **50 FR, 20 NFR, 140 acceptance criteria и 18 use cases**. После согласования: 55 Confirmed (принятые правила/reference), 9 Needs Decision, 6 Proposed. Текущий остаток 15 OQ — в Release 1 decisions. Confirmed не означает готовность production-сервисов или утверждение полного MVP. Требования с OQ/TBD нельзя считать согласованными release gates.

Owner принял рекомендации OQ review как основу (PH2-001); затем согласовал конкретные BD-01–12; BD-13–15 отложены. Не все технические параметры и остатки OQ закрыты. [Отдельный список вопросов для бизнес-решения](requirements/BUSINESS_DECISIONS_REQUIRED.md) сохраняет первоначальный опросник; текущие ответы и остатки находятся в [Release 1 decisions](requirements/RELEASE_1_DECISIONS.md). Это уточнение анализа, не новые FR или новый обязательный scope.

| Документ | Назначение |
|---|---|
| [DEVELOPMENT_HANDOFF.md](DEVELOPMENT_HANDOFF.md) | Точка входа и зафиксированный состав пакета ТЗ v1.0 |
| [RELEASE_1_DECISIONS.md](requirements/RELEASE_1_DECISIONS.md) | Текущие 15 BD, scope ядра, остаток 15 OQ и четыре бизнес-развилки RQ |
| [SYSTEM_ARCHITECTURE_AND_INTEGRATIONS.md](architecture/SYSTEM_ARCHITECTURE_AND_INTEGRATIONS.md) | Logical architecture draft, ownership, flow, INT-01–07, sync/security gates |
| [RELEASE_1_DOCUMENTATION_CHECKS.md](current/RELEASE_1_DOCUMENTATION_CHECKS.md) | Изменённые файлы и свежие проверки, включая ограничение help build |
| [DEVELOPMENT_PLAN.md](requirements/DEVELOPMENT_PLAN.md) | 10 этапов с зависимостями и QA/pilot gates, без календарных обязательств |
| [REQUIREMENTS_GAP_ANALYSIS.md](requirements/REQUIREMENTS_GAP_ANALYSIS.md) | 24 зарегистрированных пробела, последствия, источники, связи FR/NFR/OQ и проверки фазы |
| [OPEN_QUESTIONS_REVIEW.md](requirements/OPEN_QUESTIONS_REVIEW.md) | Все 15 вопросов: варианты, рекомендация, приоритет, blockers и предлагаемые decision owners |
| [BUSINESS_DECISIONS_REQUIRED.md](requirements/BUSINESS_DECISIONS_REQUIRED.md) | Конкретные решения owner/Operations сверх принятой рекомендованной основы; технический выбор отделён |
| [TECHNICAL_SPECIFICATION.md](requirements/TECHNICAL_SPECIFICATION.md) | Product scope, actors, 50 FR с source/сценариями/AC/статусом, business data и validation |
| [WORKFLOWS_AND_USE_CASES.md](requirements/WORKFLOWS_AND_USE_CASES.md) | 18 сквозных/поддерживающих сценариев, Mermaid, transitions, альтернативы и ошибки |
| [NON_FUNCTIONAL_REQUIREMENTS.md](requirements/NON_FUNCTIONAL_REQUIREMENTS.md) | 20 NFR, offline matrix, verification methods и параметры TBD без выдуманных SLA |
| [REQUIREMENTS_TRACEABILITY.md](requirements/REQUIREMENTS_TRACEABILITY.md) | Полная RTM 70 требований и связи с OQ; источники и acceptance criteria |

Это пакет для передачи команде разработки; внутренние draft-статусы технических рекомендаций и нерешённых деталей сохранены. Подготовлены [архитектурный draft](architecture/SYSTEM_ARCHITECTURE_AND_INTEGRATIONS.md) и [Development Plan](requirements/DEVELOPMENT_PLAN.md) без дат/оценок. Окончательные stack/API contracts/physical database model не утверждены. Приоритет источников фазы: подтверждённые решения и утверждённый прототип → baseline → код/действующие контракты → history. Противоречия зарегистрированы, утверждённые решения не менялись.

Для AS-IS источником является код активного router, screens/domain/stores и проверки на зафиксированной ревизии. Утверждённый прототип не превращает прежние TO-BE описания в реализованные функции. Stage 0 и BOL log сохраняют принятые продуктовые правила; при несовпадении с прототипом фиксируется разница, а код не меняется. При конфликте подтверждённых правил нужна запись решения owner, а не автоматический выбор «самого нового файла».

## Структура

```text
docs/
  DEVELOPMENT_HANDOFF.md        # пакет ТЗ v1.0 и порядок начала работ
  PROJECT_BASELINE.md           # актуальная база
  README.md                    # эта точка входа
  current/                     # аудит, инвентарь, подготовка handoff
  decisions/DECISION_LOG.md     # подтверждённые решения и источники
  requirements/                # требования, согласованный scope, RTM, план зависимостей
  architecture/                # draft компонентов, data flow и интеграций
  archive/                     # предыдущие срезы с датой
  mobile-app/                  # актуальные RU/EN инструкции и изображения
  system-report/               # технические записи с явным статусом
  mobile-ui-ux-*.md/html        # historical аудит и варианты
knowledge-base/mobile-app/     # короткие RU/EN статьи, исходники help site
```

Выбрана минимальная структура с сохранением путей публикации и ссылок. `requirements/` заполнен документами Phase 2. `architecture/` заполнен новым draft. Пустой `research/` не создавался. Состав пакетов и gates — в [handoff](current/DOCUMENTATION_HANDOFF.md).

## Карта существующих документов

| Документ / набор | Назначение | Статус |
|---|---|---|
| [PROJECT_BASELINE](PROJECT_BASELINE.md), [CURRENT_STATE](system-report/CURRENT_STATE.md) | Общий baseline и технический указатель | Current |
| [Audit](current/REPOSITORY_AUDIT.md), [Inventory](current/REPOSITORY_INVENTORY.md), [Handoff](current/DOCUMENTATION_HANDOFF.md) | Результат синхронизации и начало следующего этапа | Current |
| [Decision log](decisions/DECISION_LOG.md) | Единый индекс решений; оригиналы не удалены | Current |
| [Stage 0](system-report/STAGE_0_PRODUCT_DECISIONS.md) | PD-001–014, lifecycle, ownership, permissions, labels | Approved product TO-BE; не полная реализация |
| [BOL log](../BOL_DECISION_LOG.md) | BOL-001–015 и история ранних eBOL-инкрементов | Принятые правила + historical implementation notes |
| [RU](mobile-app/ru/README.md), [EN](mobile-app/README.md) | Quick start, user guide, business overview | Current, публикуются в help |
| [Knowledge base](../knowledge-base/mobile-app/getting-started.md), [RU](../knowledge-base/mobile-app/ru/getting-started.md) | Getting started, Pickup, Dropoff, Same Day, Scan/cargo, Interstate/BOL | Current, краткие статьи; не дубли для удаления |
| `mobile-app/images/*.png` | Иллюстрации опубликованных инструкций | Supporting; точная актуальность каждой картинки — review |
| [Pre-trip](system-report/PRE_TRIP_INSPECTION_WIREFRAME.md), [Post-trip](system-report/POST_TRIP_INSPECTION_WIREFRAME.md) | Scope осмотров, правила, исторические проверки | Supporting implementation records |
| [OTP](system-report/DELIVERY_OTP_WIREFRAME.md), [Comments](system-report/HANDOFF_COMMENTS_SIGNING_WIREFRAME.md), [Email copy](system-report/PICKUP_EMAIL_COPY_WIREFRAME.md) | Handoff confirmations, комментарии, отправка копии | Supporting; production gates остаются открытыми |
| [Team contacts](system-report/TEAM_CONTACTS_WIREFRAME.md), [External navigation](system-report/EXTERNAL_NAVIGATION_WIREFRAME.md) | Контакты/Requirements/сводка, map/copy | Supporting implementation records |
| [Documentation site](system-report/DOCUMENTATION_SITE_IMPLEMENTATION.md) | Источники/сборка/публикация VitePress | Current technical reference; старые test counts — history |
| [Stage 1](system-report/STAGE_1_CREATE_CARGO_PLACE.md) | Отдельный Create CargoPlace POC | Supporting; не mobile production |
| [Stages 2–7](system-report/README.md) | Draft, фото/offline, labels, eBOL/POD, order data, репетиция | Historical implementation/QA; итоговый scope — baseline |
| [Architecture](system-report/ARCHITECTURE.md), [System analysis](system-report/SYSTEM_ANALYSIS.md), [Stack](system-report/TECHNOLOGY_STACK.md), [DB schema](system-report/DATABASE_SCHEMA.md) | Предыдущее TO-BE проектирование и варианты | Design reference; не окончательная утверждённая архитектура |
| [Owner demo plan](system-report/OWNER_DEMO_PLAN.md), [Wireframe plan](../WIREFRAME_IMPLEMENTATION_PLAN.md), [BA weekly](system-report/BA_WEEKLY_2026_10_05_MOBILE_PLAN.md), [SMS plan](system-report/SMS_COMMUNICATIONS_PROTOTYPE_PLAN.md) | История планов и принятых инкрементов | Historical; не очередь новых изменений |
| [UX audit](mobile-ui-ux-audit.md), [P1 backlog](mobile-ui-ux-p1-backlog.md), [HTML concept](mobile-ui-ux-audit-prototype.html), [employee workflow](mobile-ui-ux-employee-workflow.html) | Аудит сентября и варианты интерфейса | Historical/research; альтернативный дизайн не принят |
| [Barcode research MD](system-report/BARCODE_SOLUTIONS_RESEARCH_2026_10_12.md), [HTML](system-report/BARCODE_SOLUTIONS_RESEARCH_2026_10_12.html) | Датированное исследование SaaS/hardware; HTML — представление отчёта | Research, не решение Mobile App; источники/цены заново не проверялись |
| [Barcode project prompt](system-report/BARCODE_PROJECT_START_PROMPT.md) | Постановка отдельного iOS-first/Sheets проекта | Separate-project context; не инструкция менять Mobile App |
| [Предыдущий CURRENT_STATE](archive/CURRENT_STATE_BEFORE_2026_10_16.md) | Срез до синхронизации, история подтверждений/проверок | Historical; заменён baseline 2026-10-16 |
| Корневые DOCX и `zaberman-mobile-app-audit/` | Исходные задания, AS-IS legacy Warehouse/Loading/BOL | Local historical evidence, ignored Git; см. inventory и OQ-14 |

Архитектурные **продуктовые границы** искать в Stage 0/BOL log и decision log; технические **рекомендации** — в четырёх design references. Не считать наличие SQL, OpenAPI или research выбором полного production-стека.

## Правила обновления

Изменение принятого baseline требует подтверждённого решения и ссылки в реестре. Старые checks сохраняются с датой; результаты Phase 1 — в аудите, Phase 2 — в Gap Analysis. В Phase 1 ТЗ не создавалось; Phase 2 добавила полный draft без окончательного согласования. После согласования BD добавлены architecture draft и Development Plan; технические гипотезы не выданы за Approved. Служебные материалы `docs/current`, `decisions`, `archive`, `system-report`, `requirements` не добавлены в меню пользовательского сайта.
