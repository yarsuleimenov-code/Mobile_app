# How Same Day Orders Work

**Current scope:** the approved product model links a Pickup and a Delivery through a RouteRun. They remain two separate operations. The current active app shows Pickup and Delivery stops, but does not provide a dedicated Same Day progress screen or a verified automatic link between the two.

1. Find the Pickup stop in **Tasks** and complete the normal [Pickup process](pickup.md).
2. Find the related Delivery stop when it is available and complete the normal [Delivery process](dropoff.md).
3. Verify the Order number and cargo evidence at each handoff.

**Expected result:** each operation has its own recorded evidence and confirmation. The app does not currently show a single “Same Day completed” result.

**Important:** do not assume Pickup automatically creates, assigns or completes Delivery. The specific task pairing and handoff rule still requires an internal business decision.

**If something goes wrong:** if the expected Delivery task is missing, use your existing dispatch/escalation process. The prototype does not define an in-app recovery action.
