# Mobile App documentation

> Prototype approved by CEO, as confirmed by the owner on 2026-10-16. Current UI/UX and implemented behavior are the reference for technical documentation. [Project baseline](../PROJECT_BASELINE.md). Implementation limits below still apply.

[Русская версия](ru/README.md)

Zaberman Mobile App is a business prototype for completing a required vehicle Pre-trip inspection, recording cargo at Pickup, verifying it at Delivery, and handling Interstate loading, receiving, and documents. The active interface uses Home, Tasks, Scan, and More. All current operational data and actions in the wireframe are local simulations; this is not a production system.

## Reading order

1. [Quick Start](quick-start.md) — first use and the shortest paths through Pickup and Delivery.
2. [User Guide](user-guide.md) — screen-by-screen instructions and exceptions.
3. [Business Overview](business-overview.md) — entities, processes, navigation, and confirmed rules.

## Knowledge Base

- [Getting Started](../../knowledge-base/mobile-app/getting-started.md)
- [Pickup](../../knowledge-base/mobile-app/pickup.md)
- [Delivery](../../knowledge-base/mobile-app/dropoff.md)
- [Same Day](../../knowledge-base/mobile-app/same-day.md)
- [Scan and Cargo](../../knowledge-base/mobile-app/scan-and-cargo.md)
- [Interstate and BOL](../../knowledge-base/mobile-app/interstate-and-bol.md)

## Scope and evidence

These pages describe the active routes in `wireframe/src/App.tsx` and the behavior in the connected screens and domain modules. Product decisions in `docs/system-report/STAGE_0_PRODUCT_DECISIONS.md` are identified as future design where the active UI does not implement them. Legacy components outside the active router are not user workflows. **Implemented** means interactive in the browser; **Simulated** means the UI changes local mock state; **Planned** means a documented target without an active route; **Unknown** means the available evidence does not establish the behavior.

The documentation was synchronized with the local working copy on **2026-11-09**, including John Doe, QR labels and the three new Administration scenarios. [User Guide](user-guide.md#rehearsal-scenarios-in-administration). Publication is a separate step.

Chrome walkthroughs on 2026-11-06 at 390 px covered Pickup → Supplemental → Delivery → POD, automatic driver names and preservation of historical signers, Pre-trip/Post-trip, QR preview/lookup and duplicate scans, broker photos, all five next-day Delivery places, warehouse return before Post-trip and partial sync with retry. Earlier walkthroughs covered Home → Tasks → Scan → More and Interstate loading/receiving. These were separate local scenarios. A complete shift with warehouse staff, a phone and real hardware has not been validated. Pickup/Delivery OTP remains covered by source and automated checks in this verification record.
