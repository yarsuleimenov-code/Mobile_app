# User guide

This guide describes the **active** Mobile App interface. Buttons can change local prototype data; route loading, device actions, signatures, document sharing and sync are simulations. Use the on-screen order number and PlaceID when following an operation. Start with [Quick Start](quick-start.md) if you need the shortest route.

## Getting started and navigation

![Home with today's stops](images/home.png)

The first screen is **Cargo operations**. Its large Pickup and Dropoff actions open an operation directly. **Load today’s route** displays a simulated Spoke route and its stops. Each stop shows Order number, sequence, scheduled time, operation, quantity and address. Search the loaded stops by External ID. Order documents, saved Pickup drafts and Recent operations appear below when there are corresponding local records.

The bottom navigation contains:

| Section | Use it for |
| --- | --- |
| **Home** | Open Pickup/Dropoff, load today's stops, resume a draft or open an Order eBOL. |
| **Tasks** | Find a loaded stop by Order ID or title; filter All, Pickup, Dropoff; open its operation or Order details. |
| **Scan** | Look up a PlaceID or Order ID and open the matching cargo record. This tab does not record a loading or delivery event. |
| **More** | Help & Instructions, Sync now, Cargo places, Interstate operations and Administration. Administration changes simulated role, branch, network and device availability. |

### Active screen map

All paths below are hash routes under the deployed site. A listed route is interactive in the wireframe; the backend and external actions remain simulated.

| Entry | Screen and route | Next useful action |
| --- | --- | --- |
| Home | Cargo operations — `#/` | Pickup, Dropoff, load route, Order documents |
| Home / bottom nav | Tasks — `#/tasks` | Open Pickup/Dropoff stop; Order details |
| Bottom nav | Scan — `#/scan` | Open place or order places |
| Bottom nav | More — `#/more` | Help & Instructions, Interstate, Cargo places, Sync now, Administration |
| Home / Tasks | Pickup draft — `#/pickup?order={number}` | Pickup review or place labels |
| Tasks / Pickup | Order details — `#/orders/{number}/details` | Return to operation |
| Pickup | Place labels — `#/orders/{number}/labels` | Print/preview, Scan, Pickup review |
| Pickup | Pickup review — `#/orders/{number}/ebol/pickup` | Pickup signing |
| Pickup review | Pickup signing — `#/orders/{number}/ebol/pickup/sign` | Locked Pickup review |
| Home / Tasks | Dropoff — `#/dropoff?order={number}` | Delivery review or Pickup review |
| Dropoff | Delivery review — `#/orders/{number}/ebol/delivery` | Delivery signing |
| Delivery review | Delivery signing — `#/orders/{number}/ebol/delivery/sign` | Completed Order eBOL / POD |
| Completed Order eBOL | POD — `#/orders/{number}/ebol/pod` | View document versions and actions |
| More | Help & Instructions — `/Mobile_app/help/ru/` | Open the mobile-friendly Russian guide; switch to English from the documentation menu |
| More | Cargo places — `#/places`; place — `#/places/{PlaceID}` | Inspect status, location, history |
| More | Interstate — `#/interstate` | Loading, incoming trip, BOL archive |
| Interstate | Loading — `#/interstate/loading` | Review — `#/interstate/review`; Trip — `#/interstate/trip` |
| Interstate | Unloading — `#/interstate/unloading/{TripID}` | Review and confirm unloading |
| Interstate | BOL archive — `#/interstate/bols`; document — `#/interstate/bol/{BOL number}` | View, Save as PDF, Print |

The code contains older Home, Pickup, Dropoff and Same Day components that are not in the active route map; do not use their screens as instructions. [Route source](../../wireframe/src/App.tsx).

## Tasks and Order details

![Tasks list](images/tasks.png)

1. On Home, select **Load today’s route** if Today's stops are not shown. This loads a local fixture; it does not connect to Spoke.
2. Open **Tasks**. Search by Order ID or title, or choose All, Pickup or Dropoff.
3. Select the task card to open the correct operation. Select **Order details · Spoke preview** to see the order name, source, quantity, special cargo information and a read-only preview of the route stop.
4. Use the screen's own primary action to save or confirm. Opening a task alone does not mark it complete.

The current Tasks list does not show a universal task-status lifecycle. It shows scheduled stops; Pickup, Dropoff and Order eBOL have separate local states. Avoid interpreting a task row as server assignment or completion.

## Pickup

![Pickup draft](images/pickup.png)

**Purpose:** capture the places and evidence received at Pickup, then confirm the Pickup handoff in Order eBOL.

**When to use:** open a Pickup stop from Home/Tasks or choose Pickup on Home, then select the correct order.

1. Check the **Order #**, operational name and **Order details**. If the name or handling details are incomplete, open Order details and fill fields available to your current role.
2. Set Pickup date, responsible manager, packaging and any order comment.
3. For each **dimension group**, enter **Qty**, L/W/H in inches and weight per place in pounds. Groups represent places with the same attributes; each place retains its own PlaceID. Add or remove groups as needed. If a measurement cannot be supplied, mark it or leave it unknown and record **Reason for unmeasured values**. The screen displays known totals separately from incomplete places.
4. Inspect **Cargo photos**. Add with **Take photo** or **Choose from gallery**, select a category and review the thumbnails. An individual photo can be previewed and removed while editing. In this wireframe these actions use local sample assets/metadata.
5. Wait for the draft status to say saved. The form autosaves locally and can be resumed from Home. Correct any **Order data incomplete** or measurement warnings. **Continue to Pickup review** enables only when the Order number, at least one place, at least one photo and required details are present and the draft saved.
6. Select **Continue to Pickup review**. The confirmation page says **Pickup draft ready**. You may open **Place labels** first: choose all, selected or one label, check the preview and select **Print**. If the printer is unavailable, continue to review and use the PlaceID check path.
7. Open **Pickup review**. Check pieces, weight, volume, photos, condition, comments from contact/driver and any exception. If evidence changed after review, return and review it again.
8. Choose **Sign on device** or **Contactless** for the Pickup contact. Contactless requires a reason and the acknowledgment checkbox. Supply contact or driver names as requested. Documented damage/exception requires its note.
9. Select **Continue to signing**. For on-device signing, have the contact sign, optionally request an email copy of this document version, and select **Accept contact signature**. Contactless skips only the contact signature. Have the Zaberman driver sign and select **Confirm & lock Pickup snapshot**.

**Result:** the Pickup snapshot is locked and read-only. An additional place must be entered as **Supplemental Pickup** with a new document version and fresh confirmations. A saved Pickup draft or a “Pickup draft ready” message alone is not the final handoff confirmation. [Pickup source](../../wireframe/src/screens/PickupCaptureScreen.tsx), [review](../../wireframe/src/screens/PickupEbolScreen.tsx), [signing](../../wireframe/src/screens/PickupSignatureScreen.tsx).

## Dropoff

![Dropoff verification](images/dropoff.png)

**Purpose:** compare delivered cargo against Pickup evidence, record condition and confirm the Delivery handoff.

1. Open the Dropoff stop from Home/Tasks or choose **Dropoff** and enter the Order number. Select **Search**. “Order not found” means the current local state has no recorded Pickup for that number.
2. Check the Order name, number of places, weight, volume, Pickup date, responsible manager and Pickup photos. An unfinished Supplemental Pickup must be completed and signed before Delivery can be confirmed.
3. Add **Delivery photos** and compare the cargo against Pickup evidence.
4. Select **Cargo matches pickup photos** only when the comparison is true. Select **No visible damage**, or choose **Report damage instead** and enter **Damage details**. Documented damage does not block the handoff.
5. Select **Confirm Dropoff**. This saves the local Dropoff operation and prepares Delivery evidence. If the Pickup snapshot is not locked, use the offered **Open Pickup review** action first.
6. Open **Delivery review**. Check evidence and comments, choose contact signature or Contactless with a reason and acknowledgment, and enter the driver name.
7. Select **Continue to signing**. Obtain the contact signature unless Contactless was selected; then obtain the driver signature. Select **Complete Order eBOL**.
8. Open **View POD**. POD appears only after both Pickup and Delivery snapshots are locked.

**Result:** Dropoff is locally confirmed at step 5; the Order eBOL becomes completed at step 7. Its POD is a view of that completed document, not a third document. [Dropoff source](../../wireframe/src/screens/DropoffVerifyScreen.tsx), [Delivery review](../../wireframe/src/screens/DeliveryEbolScreen.tsx).

## Same Day

The approved process model treats Pickup and Dropoff as separate operations linked to one RouteRun. The active app can show both types of stop on Today's route, but has no routed Same Day progress screen or verified automatic pairing of the two. Complete each stop through its normal Pickup or Dropoff path. Do not assume that finishing Pickup automatically completes or creates a Dropoff task. [Same Day article](../../knowledge-base/mobile-app/same-day.md).

## Cargo, Scan and labels

![Scan screen](images/scan.png)

A **dimension group** records quantity and shared dimensions/weight; the app preserves a distinct **PlaceID** for each physical place. **More → Cargo places** supports search by PlaceID, Order or location and opens a place record with label, status, location and short event history. Place labels are available after saving a Pickup. Reprint uses the same PlaceID in the wireframe.

To look up cargo, open **Scan**. Use **Scan label** if the simulated scanner is available, or **Enter code manually**, enter a PlaceID or Order ID and select **Find**. A found place can be opened; an Order ID opens all known places for that order. A repeated PlaceID in the same visit shows **Already scanned this visit**. An unknown code shows **Code not found** and creates nothing. The main Scan tab is lookup only; to load or receive cargo, use the input on the Interstate Loading or Unloading screen. The displayed label is Code 128; a QR-specific path is not demonstrated. [Scan source](../../wireframe/src/screens/ScanScreen.tsx).

## Photos

Pickup and Dropoff forms each require at least one photo for their primary confirmation action in the active UI. The editor supports categories **Before pickup**, **After delivery**, **Packaging**, **Condition** and **Damage**, preview and removal during editing. Pickup and Delivery galleries stay separate in review/POD; Supplemental Pickup has its own photos. The current camera/gallery actions use bundled sample images and local metadata. The app does not establish a production policy for required angles or exact subject matter. [Photo editor](../../wireframe/src/PhotoEvidence.tsx).

## Order eBOL, POD and documents

![Pickup eBOL review](images/pickup-review.png)

**Order eBOL** belongs to one Order. Its Pickup and Delivery evidence are reviewed and then locked by the corresponding confirmations. **POD** is available after both are locked. The Home **Order documents** card opens the current stage. Document versions provide read-only original, Supplemental and Delivery records. Download, Print, Email and Share dialogs show a local result; they do not generate or deliver a production document. An optional Pickup contact email-copy request is tied to one signed version and is also simulated. Do not treat the displayed signatures as legally binding production signatures. [BOL decision log](../../BOL_DECISION_LOG.md), [wireframe README](../../wireframe/README.md).

## Interstate and Interstate BOL

![Interstate operations](images/interstate.png)

1. Open **More → Interstate operations**. Choose distinct **Origin warehouse** and **Destination warehouse**, then a truck. Only eligible Pickup-recorded orders matching that direction appear for loading.
2. Select **Start loading**. Enter a PlaceID in **Scan or enter Place ID** and select **Load**, or expand an order and select individual place numbers or **Load all remaining**.
3. Select **Review N loaded places**. Check direction, truck, totals and manifest lines. Select **Create Trip & BOL**.
4. The Trip result shows TripID and Interstate BOL number. Open the BOL or return to Interstate. **Find Interstate BOL** opens a searchable archive with status filters; **Save as PDF** and **Print** call the browser print dialog.
5. To receive an incoming Trip, open it in **Incoming trips**. Enter or select the PlaceIDs received, then **Review unloading**. If places are missing, confirm the missing-place discrepancies. Select **Confirm unloading**.

The active prototype has a local Trip and receiving simulation. It does not demonstrate the entire physical movement, server close, or a linked final Delivery after unloading. The Order eBOL and Interstate BOL are different documents. [Interstate screens](../../wireframe/src/screens/InterstateScreen.tsx), [BOL screen](../../wireframe/src/screens/InterstateBolScreen.tsx).

## Completing operations and handling problems

| Message or state | What to do |
| --- | --- |
| Draft is saving / save error | Wait or keep the screen open, free browser storage if needed and retry. Do not sign from an unsaved draft. |
| Order data or measurements incomplete | Open Order details or add a reason for unknown measurement; return to the operation. |
| Order not found at Dropoff | Check the number and that Pickup was recorded in this browser state. |
| Pending Supplemental Pickup | Resume and sign its new version before Dropoff. |
| Review required | Return to the relevant review screen; direct signing links do not bypass review. |
| Camera/scanner/printer unavailable | Use the available manual PlaceID path or continue where the UI offers it. Print and scan hardware are not connected. |
| Scan code unknown or duplicate | Recheck the label/PlaceID. Lookup does not create cargo or record a movement. |
| Missing place at unloading | Review the manifest, continue receiving if appropriate, or explicitly confirm the discrepancy before closing. |
| Offline / sync retry / conflict | More shows local pending status. Retry when online; a conflict scenario offers **Keep local changes**. These are simulated outcomes, not proof of server delivery. |

For a problem without an on-screen resolution, stop before confirming the affected operation and use the team's operational escalation procedure. That procedure is not defined in the prototype and must be provided internally by the operating team.
