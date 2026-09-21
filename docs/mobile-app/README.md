# Mobile App documentation

[Русская версия](ru/README.md)

Zaberman Mobile App is a business prototype for recording cargo at Pickup, verifying it at Dropoff, and handling Interstate loading, receiving, and documents. The active interface uses Home, Tasks, Scan, and More. All current operational data and actions in the wireframe are local simulations; this is not a production system.

## Reading order

1. [Quick Start](quick-start.md) — first use and the shortest paths through Pickup and Dropoff.
2. [User Guide](user-guide.md) — screen-by-screen instructions and exceptions.
3. [Business Overview](business-overview.md) — entities, processes, navigation, and confirmed rules.

## Knowledge Base

- [Getting Started](../../knowledge-base/mobile-app/getting-started.md)
- [Pickup](../../knowledge-base/mobile-app/pickup.md)
- [Dropoff](../../knowledge-base/mobile-app/dropoff.md)
- [Same Day](../../knowledge-base/mobile-app/same-day.md)
- [Scan and Cargo](../../knowledge-base/mobile-app/scan-and-cargo.md)
- [Interstate and BOL](../../knowledge-base/mobile-app/interstate-and-bol.md)

## Scope and evidence

These pages describe the active routes in `wireframe/src/App.tsx` and the behavior in the connected screens and domain modules. Product decisions in `docs/system-report/STAGE_0_PRODUCT_DECISIONS.md` are identified as future design where the active UI does not implement them. Legacy components outside the active router are not user workflows. **Implemented** means interactive in the browser; **Simulated** means the UI changes local mock state; **Planned** means a documented target without an active route; **Unknown** means the available evidence does not establish the behavior.

The deployed site publishes `wireframe/`. The current pages were checked against the active route map, screen source and a Chrome walkthrough of the deployed build at 390 px. Screenshots in [the User Guide](user-guide.md) show the deployed interface. The browser check covered Home → Tasks → Scan → More, a complete simulated Pickup → Dropoff → POD path, Scan lookup, and Interstate loading → Trip/BOL plus incoming unloading with missing-place confirmation. No JavaScript page errors appeared in those paths.
