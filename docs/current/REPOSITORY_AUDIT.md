# Аудит и синхронизация репозитория

Дата: **2026-10-16**. Исходная ревизия: `1abe03ce0cd54697dedf713a0657c5f41f69ece3`. Получатели: owner, аналитик, разработка, QA. Цель — подготовить достоверные исходные материалы для технической документации, сохранив утверждённое приложение.

## Результат и граница аудита

Созданы [baseline](../PROJECT_BASELINE.md), [индекс](../README.md), [decision log](../decisions/DECISION_LOG.md), [инвентарь](REPOSITORY_INVENTORY.md) и [handoff](DOCUMENTATION_HANDOFF.md). Код, модели данных, assets, настройки сборки/деплоя, package manifests/lockfiles, workflows и SQL не изменялись. Утверждение CEO зафиксировано со ссылкой на поручение owner, а не на выдуманный протокол приёмки.

Инвентаризация охватила tracked source/docs/config/assets, существующие untracked research, ignored DOCX и legacy audit. Dependencies, generated output/cache и Git metadata обследованы по назначению каталогов; содержимое сторонних библиотек не является предметом полного продуктового аудита. Сопоставлены active router/providers, основные domain/stores/screens, автоматические проверки, правила Stage 0/BOL, пользовательские RU/EN документы, планы, research и исходные DOCX (извлечение текста OOXML без изменения файлов). Это аудит текущего приложения и документов, не security review каждой строки кода.

До изменений tracked worktree был чист. Уже существовали untracked:

- `docs/system-report/BARCODE_PROJECT_START_PROMPT.md`;
- `docs/system-report/BARCODE_SOLUTIONS_RESEARCH_2026_10_12.md`;
- `docs/system-report/BARCODE_SOLUTIONS_RESEARCH_2026_10_12.html`.

Их содержание сохранено; добавлены только пояснения research/separate-project статуса. Git staging/commit/push не выполнялись. Внешние документы, live integrations, актуальность vendor pricing/research links и удалённый GitHub Pages deployment заново не проверялись.

## Изменения структуры и документов

| Изменение | Файлы / смысл |
|---|---|
| Единая точка входа | Корневой `README.md`, `docs/README.md` |
| Утверждённая база | `docs/PROJECT_BASELINE.md`: статус CEO, scope, routes, понятия, systems/data flow, constraints, 15 OQ |
| Реестр решений | `docs/decisions/DECISION_LOG.md`: источники принятых правил; непроверенные выборы Needs confirmation |
| Аудит/передача | Три документа `docs/current/`: этот audit, inventory, handoff |
| Актуальная техническая сводка | `docs/system-report/CURRENT_STATE.md` и `README.md` заменяют устаревшую точку входа; история сохранена отдельно |
| Обозначение истории | Wireframe/owner/BA/SMS планы, stage 2–7, UX audit/backlog и два HTML-концепта помечены historical |
| Разделение будущего и факта | Architecture/System analysis/Stack/DB schema помечены design reference; Stage 0 не отменён |
| Синхронизация статуса | `wireframe/README.md`, BOL log, RU/EN documentation README: принято CEO, следующий этап — документация |

Публичные пользовательские пути `docs/mobile-app/`, `knowledge-base/mobile-app/` и VitePress sources оставлены на месте: их перенос без необходимости увеличил бы diff и риск публикации. Historical материалы, кроме прежней сводки, отделены статусом на месте и индексом, а не массовым перемещением. Существующие `system-report` links сохраняют работоспособность.

## Archived / removed

| Исходный материал | Действие | Причина |
|---|---|---|
| `docs/system-report/CURRENT_STATE.md` до синхронизации | Содержимое сохранено в [archive/CURRENT_STATE_BEFORE_2026_10_16.md](../archive/CURRENT_STATE_BEFORE_2026_10_16.md); по прежнему пути — новая сводка | Сохранить даты, commit history, acceptance и QA evidence, убрать устаревший текущий статус |
| Прочие проектные файлы | Не удалялись и не перемещались | Не найдено однозначного мусора, требующего удаления; полезная история и runtime dependencies сохранены |

В архивном snapshot изменены только вводная о статусе и относительные ссылки на прежние `system-report` документы. Это архив прежнего содержания, не точная байтовая копия; оригинал доступен в указанном Git commit.

Проверка SHA-256 проектных файлов (без `.git`, dependencies, generated build/cache) до синхронизации: **точных дублей не найдено**. RU/EN переводы, short KB vs user guide и MD/HTML research — разные представления с назначением, не мусорные дубли. Generated VitePress content не редактировался вручную. Созданный проверкой backend `node_modules/.audit-temp` удалён после завершения тестов; остальные build/cache outputs оставлены штатно ignored.

## Review / Cleanup Candidates

Ни один пункт ниже не является разрешением на удаление.

| Материал | Почему review | Почему оставлен / условие решения |
|---|---|---|
| `wireframe/src/screens/HomeScreen.tsx`, `PickupScreen.tsx`, `DropoffScreen.tsx`, `OperationsScreen.tsx`, `SameDayScreen.tsx` | Не подключены к active router | Проверить transitive imports и необходимость reference отдельно; удаление code вне scope аудита |
| `wireframe/src/store.tsx`, `data.ts`, `domain.ts`, `components.tsx` | Есть legacy модель/компоненты рядом с активными | Общие imports и старые tests могут зависеть от них; не считать весь модуль неиспользуемым по отсутствию route |
| `wireframe/design/concept-home-pickup.png`, `concept-cargo-recording-v2.png`, `concept-interstate-loading-v3.png` | Старые design concepts | Уникальные references; приёмка каждого изображения как финального дизайна не подтверждена |
| `docs/mobile-app/images/*.png` | Изображения могли отстать от октябрьских UI-итераций | Используются документацией/сборкой; перед следующей публикацией визуально сверить каждую иллюстрацию, не удалять |
| `docs/mobile-ui-ux-audit-prototype.html`, `docs/mobile-ui-ux-employee-workflow.html` | Альтернативные/ранние варианты | Не active app, но сохраняют историю; теперь явный historical banner |
| `WIREFRAME_IMPLEMENTATION_PLAN.md`, `OWNER_DEMO_PLAN.md`, stage 2–7 и BA/SMS plans | Исторические очереди и отчёты частично перекрываются | Содержат уникальные правила, acceptance и QA; теперь historical, будущий production plan создаётся отдельно |
| Три barcode research/prompt файла | На старте вне Git, отдельные scopes и отличающиеся рекомендации | Существующие материалы owner; не удалять, не переносить scope в Mobile App автоматически |
| Корневые DOCX и `zaberman-mobile-app-audit/` | Ignored и не переносятся clean clone | Полезное исходное evidence; OQ-14 — согласовать доступ/контроль версий |
| `docs/mobile-app/open-questions.md`, `ru/open-questions.md` | Локальные ignored RU/EN материалы | Ранее намеренно исключены из публичного Git/help; переносимая сводка вопросов включена в baseline, полные локальные файлы сохранены |
| `wireframe/dist`, `backend/dist`, `node_modules`, VitePress content/cache, tsbuildinfo | Generated/dependency материалы | Штатно игнорируются, нужны для локального запуска/проверок; ручная очистка не даёт бизнес-ценности |

## Обнаруженные противоречия и границы

| ID | Расхождение / источники | Обработка |
|---|---|---|
| C-01 | Старые README/CURRENT_STATE/планы: «следующий шаг показ owner / этап 7 не принят»; текущее поручение: CEO принял прототип | Новый статус в baseline/актуальных входах, прежние свидетельства historical |
| C-02 | Architecture/Stack содержат будущие RN/Expo/SQLite/S3/backend/IdP компоненты рядом с AS-IS описаниями | Design reference banners; текущий стек — React/Vite/localStorage, backend/SQL отдельно; OQ-10 |
| C-03 | Старый план и legacy SameDayScreen описывают полноценный RouteRun/Same Day; active App.tsx не имеет этого маршрута | В baseline это концепция, не реализованный единый flow; OQ-01 |
| C-04 | PD-012: Order-owned movement_type; active Task имеет enum, CargoRecord не хранит каноническое поле, Interstate eligibility — status+branches | Зафиксирована разница target/AS-IS; код не менялся; OQ-02/03 |
| C-05 | Историческая матрица ограничена NJ1 ↔ CA1/CA2; active selector допускает любые разные пары из шести Warehouse | Фактический справочник и selector описаны отдельно; разрешённая production матрица — OQ-02 |
| C-06 | PD-009/POC: UUIDv7 и `ZB1:<opaque ID>`; active labels/scan: `ZB-{ORDER}-{NN}` и Code 128; research рекомендует QR | Разделены prototype, принятый target identity и непринятая symbology recommendation; OQ-09 |
| C-07 | Отдельный barcode prompt: iOS-first/Sheets/Apps Script и строковый External ID; Mobile App target/POC и digit-normalized Order numbers иные | Сохранён отдельный scope; payload/IDs/master не объединяются без OQ-03/13 |
| C-08 | Offline-first TO-BE: durable files/outbox/server-confirmed Close; prototype: localStorage, metadata/mock queue и локальные outcomes | Не заявлена production offline reliability; OQ-07 |
| C-09 | Target loading может опираться на заранее созданный Trip, UI создаёт Trip после review loaded places; generated outbound не становится автоматически incoming/Delivery | Документирован фактический порядок; production assignment/linkage — OQ-03/04 |
| C-10 | PD-001 lifecycle операции/snapshot и server lock описаны подробнее, чем local eBOL lifecycle; Stage 0 говорит evidence фиксируется после первой подписи, UI snapshot lock — после driver confirmation | Сохранены оба слоя, точные production checkpoints требуют сверки в ТЗ; не менять принятую последовательность |
| C-11 | Целевая матрица permissions vs локальные role switches и Supervisor → crew lead допущение | Не объявлять прототип реальной security policy; OQ-06 |
| C-12 | Старое Telegram ТЗ: минимум 4 фото Pickup и варианты 2/4 Delivery; active формы допускают минимум одно; camera/gallery — mock | DOCX historical, не регрессия утверждённого UI; production evidence policy — OQ-05 |
| C-13 | UI PDF/email/SMS/OTP/print/sync success vs отсутствие реальных сервисов; Interstate BOL browser print отличается от Order document dialogs | Ограничения явно записаны; не менять продуктовые названия; OQ-08/09/11 |
| C-14 | Прежние количества тестов и «опубликованный baseline» относятся к старым commit/date | Актуальные локальные проверки ниже; удалённый deploy не приравнен к worktree |
| C-15 | Исходные ТЗ/audit/OQ доступны локально, но игнорируются Git | Inventory фиксирует переносимость; OQ-14. Новая сводка не требует наличия локальных файлов для понимания baseline |

Open Questions — [OQ-01–15](../PROJECT_BASELINE.md#open-questions). Новых business/architecture решений аудит не принимал. Предлагаемый состав следующего этапа — [handoff](DOCUMENTATION_HANDOFF.md).

## Проверки 2026-10-16

Среда: Windows / PowerShell, Node `v24.19.0`, pnpm `11.25.0`; существующие dependencies, без изменения manifests/lockfiles. CI использует Node 22 / pnpm 10 — CI parity отдельно не запускалась. Git read-only команды выполнялись с per-command `-c safe.directory=E:/Codex/Mobile_app` из-за различия владельцев; глобальный Git config не менялся.

| Проверка | Результат | Ограничение |
|---|---|---|
| `wireframe: pnpm test` | PASS: 27 test files / 155 tests | Domain/store/scenario suite, не полная device E2E |
| `wireframe: pnpm build:app` | PASS: TypeScript + Vite | Предупреждение JS chunk >500 kB; существующее, оптимизация вне scope |
| `wireframe: pnpm docs:build` | PASS вне sandbox | Sandbox EPERM при временной Vue junction; сборка без изменения config/code прошла вне sandbox |
| `wireframe: pnpm pages:verify` | PASS: 101 files; private Open Questions отсутствуют | Проверяет состав app/help, не remote deployment |
| `backend: pnpm build` | PASS: TypeScript | Не запуск/deploy API с БД |
| `backend: pnpm test` | PASS: 2 files / 10 tests; 1 file/test skipped | Первые запуски EPERM в Windows Temp; повтор с TEMP/TMP=`backend/node_modules/.audit-temp` прошёл. DATABASE_URL не задавался, integration test пропущен |
| Lint | Не предусмотрен | В обоих package.json отсутствует lint script/config; TypeScript build выполнен, новый lint не добавлялся |
| PostgreSQL migrations / RLS / DB integration | NOT RUN / SKIPPED | Не предоставлена disposable `*_test` DB; deployed database не изменялась |
| Browser smoke | PASS в проверенном объёме | Chrome, local dev server `http://127.0.0.1:5174/Mobile_app/`, обычный desktop viewport; без device matrix/full E2E |

Browser path: in-app browser и sandbox server недоступны по localhost; Vite вне sandbox на 5174 доступен Chrome. Проверены meaningful content/title, отсутствие framework overlay, реальные переходы и console logs (`[]` для error/warn). Home → Pickup draft (groups/photos/273.44 cu ft), Home → Dropoff → Search (Pickup evidence), Tasks (7 stops), Scan → Scan label (Place found), More → Interstate → Start loading → ввод `ZB-11155599-02` → Review 1 loaded place → Create Trip & BOL → Open Interstate BOL. Локальный Trip содержит одно выбранное место; Home → Start открывает Pre-trip checklist; возврат через Go back → Pickup → Continue to Pickup review → Open Pickup review показывает Order eBOL с 11 places, 273.44 cu ft и четырьмя фото. Screenshot Loading визуально просмотрен. Настоящая печать/отправка/подписание не выполнялись. Не проверены полный Pickup→Delivery→POD UI flow, полный inspection cycle, mobile widths и все error/device states; связанные domain tests проходят.

Smoke работает с локальными fixtures; операции записи в браузере остаются localStorage указанного test origin. Source/config/assets и существующий публичный deploy от этого не меняются.

Итоговая полная команда `pnpm build` (app + help) и `pnpm pages:verify` прошла после правок документов. App bundles до/после синхронизации имеют те же имена с content hash: `index-DvO83sk2.css`, `index-DsvCWljF.js`.

Проверка локальных Markdown и HTML ссылок через Node fs/path: 78 Markdown-файлов, 740 локальных ссылок, 13 Markdown anchors; отсутствующих targets нет. Исправлен старый неверный anchor P2 в архивной сводке. Проверены file targets и heading anchors; внешние HTTP links, browser router query semantics и HTML fragment anchors не валидировались этим скриптом. Часть local supporting targets намеренно ignored — это не гарантия их наличия в clean clone.

`git diff --check` проходит. `git diff --name-only` по source/config/assets/backend/database/CI и AGENTS.md не показывает изменений; изначально tracked worktree был чист. Изменения ограничены Markdown и тремя standalone HTML research/concept документами. Функциональная идентичность подтверждается неизменностью исходников/сборочных входов, одинаковыми app bundle hashes, suite и ограниченным browser smoke; полный production/device regression этой задачей не заявляется.
