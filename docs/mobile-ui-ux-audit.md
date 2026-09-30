# Zaberman Mobile App — UI/UX audit

**Audit date:** 2026-09-26  
**Audited baseline:** published `main` / GitHub Pages baseline described in `docs/system-report/CURRENT_STATE.md` (2026-09-21)  
**Primary users:** drivers, warehouse staff, loading staff, delivery crew  
**Decision priority:** task speed → clarity → error prevention → consistency → aesthetics

**Owner decision:** сохранить существующий дизайн и single-screen формат. Альтернативный дизайн не принят. Рекомендации аудита должны применяться как точечные улучшения текущего интерфейса, а не как redesign.

## 1. Executive Summary

The application already has a coherent operational foundation: `Home | Tasks | Scan | More`, separate Pickup and Dropoff operations, cargo-place identity, labels, photo evidence, eBOL/POD, exception states, and a secondary Interstate area. The strongest parts are the explicit separation of physical cargo places, preservation of signed versions, and the existence of recoverable draft/sync states.

The main UX issue is not visual polish. The product exposes too much workflow detail at once while the most important operational question — **“What should I do next?”** — is not consistently the dominant element. Pickup is a long multi-section form rather than a short task-oriented sequence; task cards need a clearer hierarchy; scan outcomes need a single persistent next action; and status language mixes operation state, evidence completeness, device state, and sync state.

Same Day is intentionally excluded from current recommendations because there is no business decision on its scope. The audit records the AS-IS absence of an active RouteRun flow but does not treat it as a defect or implementation priority.

No P0 issue was confirmed from the available evidence. The main confirmed P1 issues are weak next-action continuity across long Pickup/Dropoff work and insufficient separation of operational status from sync/evidence status. Most visual-system issues are P2/P3 and should not delay workflow corrections.

### Key conclusions

1. Keep `Home | Tasks | Scan | More`; it matches daily operational work.
2. Keep Pickup and Dropoff as separate tasks; Same Day remains outside the current UI/UX scope.
3. Make Home an action queue: resume active work first, then next Pickup/Dropoff, then attention states.
4. Keep the existing continuous operational form, section order, autosave pattern, CTA placement, and visual language; improve only confirmed friction points.
5. Use one task-card hierarchy: operation + address + time window first; customer/order and service type second.
6. Treat Scan as a loop: identify → show unambiguous result → offer exactly one context-appropriate action → remain ready for the next scan.
7. Separate four state dimensions: operation, cargo/evidence completeness, sync, and exception.
8. Keep Interstate and BOL secondary under assigned tasks and `More`; do not promote them to primary navigation.
9. Reduce manual input for quantity and dimensions with defaults, steppers, presets, duplication, and order data.
10. Do not start with a visual redesign. First simplify hierarchy, actions, statuses, and Same Day continuity.

## 2. Audit Scope

### Goal and minimum complete result

Assess the current mobile interface as an operational tool, identify workflow and consistency risks, prioritize them, and define a practical TO-BE model without modifying production code or business logic.

### In scope

- Active route map and documented UI behavior.
- Home, Tasks, Scan, More, Cargo places, Pickup, Dropoff, eBOL/POD, Interstate Loading/Unloading/BOL.
- Primary flows: Pickup, Dropoff, Scan; intended Same Day; secondary Interstate.
- Navigation, hierarchy, actions, forms, statuses, mobile ergonomics, accessibility, consistency.
- Existing rendered-QA evidence for 320/390/1440 px from project documentation.

### Evidence and limitations

Evidence is classified as:

- **Confirmed — route/source:** active routes in `wireframe/src/App.tsx` and implemented scope in `CURRENT_STATE.md`.
- **Confirmed — project QA:** documented completed browser checks for 320/390/1440 px and 106 frontend tests.
- **Product rule:** accepted rules in `STAGE_0_PRODUCT_DECISIONS.md`, `OWNER_DEMO_PLAN.md`, and `WIREFRAME_IMPLEMENTATION_PLAN.md`.
- **Audit inference:** UX conclusion derived from the confirmed route/scope and operational context; it must be visually rechecked before implementation.

The interactive browser and local shell were unavailable during this audit because the Windows sandbox failed with `setup refresh had errors`. The published app could not be re-run at 360/390/430 px in this session. Therefore:

- 390 px behavior is supported by prior rendered-QA evidence;
- 320 px evidence gives a stronger narrow-width stress case than 360 px;
- 360 and 430 px require a short follow-up visual verification;
- contrast ratios, exact touch-target dimensions, keyboard overlap, and safe-area behavior are not claimed as measured facts.

This limitation is material. The audit is complete as a structural/flow audit, but the visual conformance check must be repeated before development estimates are finalized.

## 3. Current Information Architecture

### Active navigation

```text
Home
├─ Pickup
├─ Dropoff
├─ Cargo places
└─ Recent/active work

Tasks
├─ Task/order details
├─ Pickup workflow
└─ Dropoff workflow

Scan
├─ identify PlaceID / order
├─ valid / duplicate / unknown result
└─ open cargo/order/action

More
├─ Interstate
│  ├─ Loading → Review → Trip
│  ├─ Unloading
│  └─ BOL archive/detail
└─ Administration (`#/more/demo`)
```

### Route inventory

The active router exposes 23 operational screens/routes: Home, Tasks, Scan, More, Administration, cargo-place list/detail, Pickup, order detail, labels, Pickup eBOL/signature, Delivery eBOL/signature, POD, document detail, Dropoff, Interstate list, Loading, Review, Trip, Unloading, and Interstate BOL list/detail.

### IA assessment

- **Recommended to keep:** four-item bottom navigation; Scan as a first-class destination; More as the home for secondary/administrative functions.
- **Problem:** Same Day/RouteRun is defined in product rules but absent from the active router.
- **Problem:** eBOL/POD has many internal routes. They should remain contextual children of an Order/Task, not become perceived top-level destinations.
- **Problem:** Administration is correctly hidden under More, but its operational-state controls can create states that look real. Entry and destructive reset need strong separation from normal work.

## 4. Primary User Flows

### Pickup — AS-IS

```text
Home/Tasks → Pickup → select/confirm Order → dimension groups / cargo places
→ photos → labels → Pickup eBOL review → signatures → completion/status
```

Estimated interaction burden is high because one physical operation crosses multiple sections/screens and includes data entry, evidence, printing, review, and signatures. Exact tap count varies by number of groups, photos, and signature mode; a fixed count would be misleading.

### Dropoff — AS-IS

```text
Home/Tasks → Dropoff → verify expected places → exceptions/photos
→ Delivery review/eBOL → recipient/staff confirmation → POD
```

The domain separation is correct. The main risk is losing the current order/place context while moving between reconciliation, evidence, signatures, and documents.

### Same Day — AS-IS gap

```text
Expected: Pickup task → completed/synced → In transit → Dropoff task → completed
Actual: separate Pickup and Dropoff routes exist; active RouteRun flow is not wired.
```

The UI does not currently provide a single operational overview that explains that these are two separate operations in one movement.

### Scan — AS-IS

```text
Scan → valid / duplicate / unknown → cargo/order lookup → contextual action
```

The documented behavior includes valid, duplicate, unknown, and manual lookup. The UX requirement is to prevent an invalid scan from navigating away or changing counts.

### Interstate — AS-IS

```text
More/assigned work → Trip → Loading scan → Review/Close
→ Trip manifest → Unloading → reconcile/confirm → BOL archive/detail
```

This is appropriately secondary. It should appear on Home only when assigned or needing attention.

## 5. UX Findings

### UX-02 — Primary work is distributed across a long multi-stage form

**Screen / Flow:** Pickup  
**Problem:** dimensions, cargo groups, photos, labels, review, and signatures compete for attention inside a long operation when section hierarchy and completion summaries are weak.  
**Evidence:** active routes and implemented feature list expose separate data, labels, eBOL, and signature steps; owner-demo plan describes a 5–7 minute happy path.  
**User impact:** more scrolling and context switching; omissions are discovered late; one-handed use is harder.  
**Recommendation:** keep the approved existing single operational screen and current section composition. Limit changes to clearer labels, concise completion counts, validation, status wording, and responsive defects confirmed by testing. Do not introduce new layout concepts or wizard screens.  
**Priority:** P1 — High  
**Effort:** Medium

### UX-03 — Status dimensions are mixed

**Screen / Flow:** Pickup, Dropoff, photos, documents, sync  
**Problem:** operation status, evidence completeness, sync status, and exception status can all be presented as badges/messages of similar weight.  
**Evidence:** implemented scope includes `Saved on device`, pending/syncing/synced, retry/conflict, signed snapshots, damage/refusal, and operation completion.  
**User impact:** a user may interpret “Saved” or “Signed” as completed, or miss a sync failure after physical work is done.  
**Recommendation:** show four labeled rows/slots: `Operation`, `Cargo & evidence`, `Sync`, `Issue`. Only operation status controls the main CTA. Sync always includes text and timestamp; exceptions use an icon plus text, never color alone.  
**Priority:** P1 — High  
**Effort:** Small

### UX-04 — Task cards need operational hierarchy

**Screen / Flow:** Home / Tasks  
**Problem:** Order, customer, address, time, service type, and status are all necessary but cannot have equal visual weight.  
**Evidence:** product scope requires all these attributes; active Home and Tasks are the main entry points. This is an audit inference requiring visual confirmation.  
**User impact:** slower identification of the next physical location and higher risk of opening the wrong operation.  
**Recommendation:** first line: `PICKUP`/`DROPOFF` + due status; second: address, max two lines; third: time window; fourth: customer · Order ID · service badge. Card CTA is `Start` or `Resume`; tapping elsewhere opens details.  
**Priority:** P1 — High  
**Effort:** Small

### UX-05 — Pickup and Dropoff distinction must not rely on color

**Screen / Flow:** Home / Tasks / Task detail  
**Problem:** color badges alone are insufficient in poor lighting and for color-vision deficiencies.  
**Evidence:** operational context requires quick differentiation; exact current color treatment was not measurable in this session.  
**User impact:** wrong operation can be selected for the correct order.  
**Recommendation:** always pair explicit text (`Pickup`, `Dropoff`) with distinct icons and directional wording (`Collect at`, `Deliver to`). Repeat operation type in the header and completion confirmation.  
**Priority:** P1 — High  
**Effort:** Small

### UX-06 — Scan needs one stable result pattern

**Screen / Flow:** Scan  
**Problem:** valid, duplicate, unknown, and manual-lookup outcomes can create competing paths.  
**Evidence:** all four outcomes are implemented/documented.  
**User impact:** repeated scans may change counts unexpectedly or force the user out of the scan loop.  
**Recommendation:** use one bottom sheet with outcome icon + text + PlaceID/Order + exactly one primary action. `Duplicate` must say “Already scanned — count unchanged”; `Wrong task` must not navigate or mutate progress; keep `Scan next` available.  
**Priority:** P1 — High  
**Effort:** Small

### UX-07 — Manual dimension entry is error-prone

**Screen / Flow:** Pickup / Cargo Piece  
**Problem:** five compact fields in one row prioritize density over error prevention on narrow phones.  
**Evidence:** owner plan explicitly specifies dimension groups with Qty and five compact fields in one row.  
**User impact:** wrong units, transposed L/W/H, keyboard overlap, and mistyped quantity/weight.  
**Recommendation:** use Qty stepper; label every value with unit; use numeric keyboards; keep L/W/H as three equal inputs on one row only at ≥390 px and wrap weight/package below at 360 px; add `Copy previous group`; allow `Unknown` only with a reason.  
**Priority:** P1 — High  
**Effort:** Medium

### UX-08 — Completion confirmation needs a concise consequence summary

**Screen / Flow:** Pickup/Dropoff confirmation  
**Problem:** confirmation can become another long review rather than an error-prevention checkpoint.  
**Evidence:** reviews include places, evidence, comments, signatures, exceptions, and sync states.  
**User impact:** users skim and confirm incomplete or wrong work.  
**Recommendation:** show only exceptions and totals by default: order, operation, address, expected/actual places, open issues, signer, sync consequence. Expand full details on demand. CTA text must state outcome: `Complete Pickup — 4 places` or `Complete partial Dropoff — 3 of 4`.  
**Priority:** P1 — High  
**Effort:** Small

### UX-09 — Destructive and irreversible states need stronger boundaries

**Screen / Flow:** signatures, locked documents, supplemental pickup, Administration reset  
**Problem:** ordinary navigation, immutable confirmation, and local-data reset have very different consequences.  
**Evidence:** signed evidence is immutable; corrections create supplemental versions; Administration can reset local data.  
**User impact:** data loss or misunderstanding of which version was signed.  
**Recommendation:** reserve confirmation dialogs for irreversible operations; show version in dialog; require typed/repeated confirmation only for reset, not routine completion; after signing, replace edit controls with `Create supplemental version`.  
**Priority:** P1 — High  
**Effort:** Small

### UX-10 — Interstate should not compete with daily work

**Screen / Flow:** Home / More / Interstate  
**Problem:** Interstate includes many detailed screens that can dominate navigation if surfaced globally.  
**Evidence:** eight Interstate routes exist; product context defines it as secondary.  
**User impact:** daily Pickup/Dropoff work becomes harder to find.  
**Recommendation:** keep Interstate under More and assigned task cards. Show it on Home only for active/attention trips. BOL remains inside Trip, not a global documents section.  
**Priority:** P2 — Medium  
**Effort:** Small

## 6. UI Findings

### Recommended visual hierarchy

- Screen title: 24–28 px, semibold; operation type is part of the title.
- Address: 18–20 px, semibold, up to two lines.
- Time window / next action: 16 px, medium.
- Order/customer metadata: 14–16 px.
- Helper/status text: minimum 14 px; never use low-contrast gray for required information.
- Touch targets: minimum 44×44 px; prefer 48 px for warehouse use.
- Sticky primary action: full-width within thumb reach, above bottom navigation/safe area.
- Cards: one border/elevation style; use section dividers before nested cards.

### UI issues

1. Multiple badge types are likely to create visual noise because operation, movement, sync, document, device, and exception states all exist. Limit each card to two visible badges; move the rest into details.
2. Icons must always have text for operational actions. Icon-only print, retry, remove, and scan controls are unsafe in glove/low-light contexts.
3. Disabled actions must include an adjacent reason (`Add at least one photo`) or a tappable explanation.
4. Bottom sheets are preferred for scan results and short choices; full-screen pages are preferred for data entry and irreversible review.
5. Empty states need one action and one explanation. Loading states should preserve layout to avoid accidental taps.
6. Error banners should identify what was saved, what failed, and the recovery action.

## 7. Mobile Usability

### Width assessment

| Width | Evidence | Assessment / required follow-up |
|---|---|---|
| 360 px | Not rerun; prior 320 px QA passed key flows | Likely structurally safe, but recheck five-field dimension rows, long addresses, label actions, and sticky CTA |
| 390 px | Prior project rendered QA passed | Supported baseline; use as design reference |
| 430 px | Not rerun | Recheck max card width and avoid stretching compact controls; no reason to increase information per row |

### One-handed use

- Place primary CTA in the lower third; keep destructive actions away from it.
- Do not require reaching the top to continue after editing a long cargo list.
- Keep Scan trigger and `Scan next` near the bottom.
- Avoid horizontal carousels for tasks or cargo places.
- Preserve current task header when scrolling.

### Required visual regression checks

- No horizontal overflow at 360/390/430 px.
- 60+ character address and 50+ character customer/trade name.
- 100-photo list and 20-place list.
- Numeric keyboard open on last dimension input; sticky CTA must remain visible or move above keyboard.
- Safe-area inset on iOS and Android gesture navigation.
- Bottom sheet max height and internal scroll.
- Back navigation from signature/document/label preview returns to the same order and scroll position.

## 8. Accessibility

Critical checks before implementation:

- Minimum 4.5:1 contrast for normal text; 3:1 for large text and control boundaries.
- 44×44 px minimum targets; 48 px preferred for field use.
- Visible keyboard focus for all interactive elements, including custom cards and bottom navigation.
- Explicit labels for every input; placeholders are examples, not labels.
- Error text is linked to the field and announced; focus moves to the first invalid field on submit.
- Status uses text + icon + optional color.
- Active/disabled/completed states differ by label and affordance, not opacity alone.
- Signature canvas has an OTP alternative defined by business rules.

**Unverified in this session:** measured contrast, DOM accessible names, focus order, screen-reader announcements, reduced motion, and actual target sizes. Treat these as acceptance tests, not confirmed defects.

## 9. Consistency Issues

| Entity/action | Required canonical pattern |
|---|---|
| Task card | operation, address, time, customer/order, service, status, one CTA |
| Cargo place | PlaceID, n/N, dimensions/weight with source, package, status/location |
| Primary action | one filled button per viewport; verb + object + consequence |
| Secondary action | outline/text; never same weight as primary |
| Operation status | Not started / In progress / Ready to complete / Completed / Partial / Refused |
| Sync status | Saved on device / Pending / Syncing / Synced / Needs action |
| Exception | type + affected place + evidence state + owner/next action |
| Back navigation | returns to parent context; preserves draft and selected order |
| Confirmation | concise totals + exceptions + consequence; no unrelated controls |

## 10. Screen-by-Screen Findings

| Screen/family | Purpose / primary user | Primary action | Main finding | Priority |
|---|---|---|---|---|
| Home | next work for field staff | Resume/Start Pickup/Dropoff | must prioritize active work and next address; no generic dashboard content | P1 |
| Tasks | assigned operation list | Start/Resume | needs common card hierarchy and operation-first filters | P1 |
| Scan | identify place/order | Scan next / Open action | one stable result sheet; duplicate must not mutate | P1 |
| More | secondary functions | open selected tool | Interstate and Administration belong here; keep operational clutter out | P2 |
| Administration | controlled scenarios/settings | apply/reset | destructive reset boundary and clear environment context | P1 |
| Cargo places list/detail | physical-unit traceability | inspect/edit allowed data | standardize PlaceID, source of dimensions/weight, current location/status | P2 |
| Pickup | capture physical handoff | Continue/Complete Pickup | long workflow needs stages and sticky next action | P1 |
| Order details | verify order context | Start/Resume operation | address/time/operation above commercial metadata | P1 |
| Labels | print/reprint | Print selected | selection count and printer state must be explicit; zero-selection reason | P2 |
| Pickup eBOL/signature | review and lock version | Confirm/sign version | version and immutable consequence must be dominant | P1 |
| Dropoff verify | reconcile expected places | Scan/Complete Dropoff | expected vs scanned vs issue counts always visible | P1 |
| Delivery eBOL/signature | recipient evidence | Confirm/sign delivery | refusal/damage cannot be masked by successful signature | P1 |
| POD/document detail | inspect/share result | View/Print/Email | read-only state and document version need consistency | P2 |
| Interstate list/trip | assigned secondary work | Resume Loading/Unloading | show only assigned/attention work; BOL contextual | P2 |
| Loading/Unloading | manifest reconciliation | Scan next/Close | continuous scan loop; wrong trip blocks without losing context | P1 |
| Interstate BOL | document lifecycle | view/retry | document failure must not roll back physical close | P1 |

## 11. Flow-by-Flow Findings

### Pickup

- Entry should be one tap from Home for assigned/resumable work.
- Order/address confirmation precedes cargo data entry.
- Group duplication and quantity steppers reduce input.
- Photo/label completeness is visible before review.
- Final CTA includes place count and completion type.

### Dropoff

- Start with expected/scanned/issues summary.
- Every scan immediately explains whether progress changed.
- Pickup reference photos and known damage are read-only context.
- Recipient confirmation happens after reconciliation, not before.

### Same Day

- RouteRun is an overview, not a new business operation.
- Pickup completion returns to route overview.
- `In transit` is a clear intermediate state with no manifest semantics.
- Dropoff opens as a separate task with cargo inherited from confirmed Pickup.

### Scan

- Keep camera/scan context active after success or error.
- Support manual fallback without giving it equal prominence.
- Never increment on duplicate, unknown, or wrong-task scan.

### Interstate

- Trip identity, route, warehouse, truck, and progress remain pinned.
- Loading checks expected manifest; Unloading checks confirmed loaded manifest.
- Close summarizes missing/extra/damaged and requires appropriate authority.

## 12. Prioritized Issues

### P0 — Critical

No P0 issue was confirmed. Before production, destructive reset isolation, duplicate-scan idempotency, wrong-task blocking, and immutable signatures must be verified with real integrations; a failure there would become P0.

### P1 — High

1. Pickup/Dropoff lack a consistent staged next-action model.
2. Operation, evidence, sync, and exception statuses compete.
3. Task cards need operation/address/time hierarchy.
4. Pickup/Dropoff distinction must use text and icon, not color alone.
5. Scan result pattern must prevent duplicate/wrong-task mutation.
6. Compact dimension entry is risky at narrow widths.
7. Final confirmation needs concise totals and consequence-based CTA.
8. Immutable signing/supplemental/reset boundaries need explicit confirmation.
9. Loading/Unloading must pin Trip context and reconciliation counts.

### P2 — Medium

- Badge density and inconsistent state placement.
- Interstate visibility outside assigned/attention context.
- Cargo-place presentation consistency.
- Label selection/print state clarity.
- Document version/read-only consistency.
- Empty/loading/error patterns.

### P3 — Low

- Fine typography tuning after hierarchy is fixed.
- Card shadow/radius normalization.
- Non-operational icon refinement.
- Decorative color and spacing polish.

## 13. Quick Wins

| Change | Problem solved | Impact | Effort |
|---|---|---:|---:|
| Reorder task card to operation → address → time → metadata | slow task identification | High | Small |
| Replace generic CTA labels with `Start Pickup`, `Resume Dropoff`, `Complete Pickup — 4 places` | ambiguous next action | High | Small |
| Add sticky primary CTA to Pickup/Dropoff | scrolling and reach cost | High | Small |
| Add `Expected / Scanned / Issues` pinned summary | reconciliation errors | High | Small |
| Add explicit duplicate scan message `count unchanged` | accidental double count concern | High | Small |
| Split operation and sync status into separate labeled rows | status confusion | High | Small |
| Add disabled-action reason under the button | dead ends | Medium | Small |
| Add Qty ± stepper and `Copy previous group` | manual entry burden | High | Small |
| Limit cards to two visible badges | visual noise | Medium | Small |
| Keep `Interstate` only under More/assigned tasks | navigation competition | Medium | Small |

## 14. TO-BE UX Model

### Information architecture

```text
Home | Tasks | Scan | More

Home
├─ Resume active operation
├─ Next assigned Pickup/Dropoff
├─ Active Same Day route
└─ Attention: sync/issues/assigned Interstate

Tasks
├─ Today / Upcoming / Completed
├─ Pickup / Dropoff
└─ Local / Same Day / Interstate filters

Scan
├─ Global identification
└─ Contextual scan when operation is active

More
├─ Interstate
├─ Sync / device / printer
├─ History
└─ Administration
```

### Home

1. Context strip: branch/role + network/sync indicator.
2. Resume card if any active operation exists.
3. Two quick actions: `Start Pickup`, `Start Dropoff`.
4. Next tasks ordered by time and operational urgency.
5. Active Same Day route card with current stage and next address.
6. Attention section only when action is required.

### Tasks

- Default: Today + assigned tasks.
- Search Order ID/place/customer/address.
- Filters in one compact sheet, not persistent chip overload.
- One canonical task-card component.

### Pickup

Existing continuous autosaved screen:

```text
Order context
→ Responsible manager / packaging / comment
→ Totals
→ Dimension groups
→ Cargo photos
→ Labels
→ Review
```

- Preserve the current header, Pickup draft, Order ID and autosave state.
- Cargo uses dimension groups with Qty and generated PlaceIDs.
- Section headers show compact totals, such as `1 group · 3 pcs` and `3 photos`.
- Preserve the current CTA to final Review; routine data entry does not require screen transitions.
- Final review shows totals/exceptions only, with details collapsible.

### Dropoff

Existing continuous autosaved screen:

```text
Order context
→ Expected / scanned / issues
→ Cargo reconciliation
→ Photos / exceptions
→ Recipient data
→ Review
```

- Pinned expected/scanned/issues counts.
- Scan opens as a focused tool and returns to the same Dropoff scroll context.
- Known damage and Pickup photos are read-only references.
- Preserve the current CTA to Review; POD follows successful/partial/refused completion.

### Same Day

```text
RouteRun
├─ Pickup task — completed
├─ In transit — current
└─ Dropoff task — next
```

One route overview links two independent operations. No Loading, Unloading, manifest, or BOL.

### Scan

- Global scan identifies a place/order and offers contextual action.
- In-task scan validates against current operation.
- Bottom sheet outcomes: success, already scanned, wrong task, unknown.
- One primary action, plus `Scan next`.

### Cargo Piece

- Canonical summary: `Place 2 of 4 · short PlaceID`.
- Dimensions and weight show unit and source (`Measured`, `Declared`, `Unknown`).
- Package type, status/location, evidence count, and immutable history.
- Edit only fields permitted before confirmation; otherwise create supplemental/correction.

### Interstate / BOL

- Entry through assigned task or `More → Interstate`.
- Trip detail owns manifest, Loading/Unloading, discrepancies, and BOL.
- BOL failure is a document status, not a reversal of Loading.

## 15. Recommended UI Patterns

### Status model

| Dimension | Values | Presentation |
|---|---|---|
| Operation | Not started, In progress, Ready, Completed, Partial, Refused | primary status near title |
| Evidence | 3/4 photos, 4/4 labels, signature missing | checklist/progress |
| Sync | Saved on device, Pending, Syncing, Synced, Needs action | separate row with timestamp |
| Exception | Missing, Extra, Damaged, Wrong task, Refused | icon + text + owner/action |

### Actions

- One primary CTA visible per viewport.
- CTA verb names the operation and consequence.
- Secondary actions never use the same filled style.
- Destructive actions are separated spatially and require confirmation.
- Disabled action includes the missing prerequisite.

### Forms

- Default from order/task whenever possible.
- Use steppers for count, presets for package type/reasons, and scanners for identity.
- Numeric keyboard and unit suffixes for dimensions/weight.
- Inline validation at field level; summary only on submit.
- Autosave state displayed without implying server completion.

### Feedback

- Success: what changed + next action.
- Error: what remained saved + what failed + retry path.
- Offline: local result first; sync status second.
- Confirmation: totals and exceptions, not a full duplicated form.

## 16. Open Questions

1. Is Same Day part of the next MVP or intentionally deferred? If included, what system assigns RouteRun and sequence?
2. Which fields block Pickup/Dropoff completion versus create a warning?
3. Is recipient signature required, or may it be replaced by a verified OTP per branch/customer?
4. Who may complete Partial/Refused and who may override wrong-trip/extra cargo?
5. What is the authoritative source for task time windows and changes during a route?
6. Which photo categories are required by operation/customer/service type?
7. What are the production units and allowed ranges for dimensions/weight?
8. What exact event makes a local operation server-confirmed, and how long may Pending remain actionable?
9. Should Administration be visible to all prototype viewers or only a facilitator role in future builds?
10. Which device/printer/scanner combinations define the first production hardware baseline?

## 17. Recommended Implementation Sequence

1. **P1 hierarchy and status patch:** canonical task cards, action labels, separate operation/sync/exception state, disabled reasons.
2. **P1 workflow continuity:** single-screen Pickup/Dropoff section hierarchy, autosave, sticky Review CTA, concise confirmation, pinned reconciliation counts.
3. **P1 Scan safety:** standard result sheet, duplicate/wrong-task no-op behavior, continuous loop.
4. **P1 form ergonomics:** Qty stepper, wrapping dimension layout, units, numeric keyboard, copy previous.
5. **Accessibility and viewport acceptance:** rerun 360/390/430 px, keyboard, safe area, long text, focus, labels, contrast, and screen reader.
6. **P2 consistency:** consolidate badges, cards, document/version views, empty/loading/error patterns.
7. **P3 visual polish:** typography/spacing/icon refinements only after operational tests pass.

### Acceptance metrics for the next iteration

- Assigned Pickup/Dropoff starts in ≤2 transitions.
- At every step, one primary next action is visible.
- User can identify operation, address, and time within one task-card scan.
- Duplicate/wrong-task scan never changes counts.
- Completion view exposes expected/actual/issues without scrolling at 390 px.
- Same Day user can state current stage and next stop from one screen.
- No horizontal overflow at 360/390/430 px; keyboard does not obscure active field or CTA.

---

## Audit deliverables and change boundary

- Created this audit document only.
- Static AS-IS → TO-BE concept: `docs/mobile-ui-ux-audit-prototype.html`.
- Rejected design exploration, retained only as non-authoritative audit history: `docs/mobile-ui-ux-employee-workflow.html`.
- Production application code, business logic, routes, fixtures, and styles were not changed.
