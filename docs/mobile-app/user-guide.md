# User guide

This guide describes the **active** Mobile App interface. Buttons can change local prototype data; route loading, device actions, signatures, document sharing and sync are simulations. Use the on-screen order number and PlaceID when following an operation. Start with [Quick Start](quick-start.md) if you need the shortest route.

## Getting started and navigation

![Home with today's stops](images/home.png)

The first screen is **Cargo operations**. Its large Pickup and Dropoff actions open an operation directly. The **Pre-trip inspection** card controls access to **Load today’s route**: the route remains locked until the inspection passes. A loaded route displays simulated Spoke stops with Order number, sequence, scheduled time, operation, quantity and address. Search the loaded stops by External ID. Order documents, saved Pickup drafts and Recent operations appear below when there are corresponding local records.

The bottom navigation contains:

| Section | Use it for |
| --- | --- |
| **Home** | Open Pickup/Dropoff, load today's stops, resume a draft or open an Order eBOL. |
| **Tasks** | Find a loaded stop by Order ID or title; filter All, Pickup, Dropoff; open its operation or Order details. |
| **Scan** | Look up a PlaceID or Order ID and open the matching cargo record. This tab does not record a loading or delivery event. |
| **More** | Help & Instructions, Sync now, Cargo places, Interstate operations and Administration. Administration controls role, branch, network, operation outcomes, device availability and local scenario data for demonstrations. |

### Active screen map

All paths below are hash routes under the deployed site. A listed route is interactive in the wireframe; the backend and external actions remain simulated.

| Entry | Screen and route | Next useful action |
| --- | --- | --- |
| Home | Cargo operations — `#/` | Pickup, Dropoff, load route, Order documents |
| Home | Pre-trip inspection — `#/pre-trip-inspection` | Complete checklist, five photos including Dashboard and driver attestation |
| Home, after Pre-trip | Post-trip inspection — `#/post-trip-inspection` | Record vehicle condition after use; view completed/archived inspections |
| Home / bottom nav | Tasks — `#/tasks` | Open Pickup/Dropoff stop; Order details |
| Bottom nav | Scan — `#/scan` | Open place or order places |
| Home / Tasks / Pickup draft / Order details | Messages — `#/communications`, `#/orders/{number}/communications` | Send or review customer SMS; start an Order-linked call |
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

## Pre-trip inspection

**Purpose:** confirm that the assigned vehicle is safe before loading Today's route.

1. On Home, find the **Pre-trip inspection** card for **Van 08 · Extended Van**. Select **Start** or **Continue**.
2. Inspect all eight groups: Tires & wheels; Lights & reflectors; Windows, mirrors & wipers; Leaks under vehicle; Body, doors & cargo area; Brakes, steering & horn; Emergency equipment; Company equipment & tools. Select **Pass** or **Issue** for each.
3. Select **Continue to photos**. Use **Take photo** for Front, Rear, Driver side, Passenger side and Dashboard. Keep the full vehicle and wheels in frame. Gallery upload is intentionally unavailable.
4. Select **Review inspection**. If every check passes, select **I confirm this vehicle is safe to operate**, then **Complete inspection**.
5. The result shows **Ready for route**. Return Home; the card shows **Vehicle cleared** and **Load today’s route** is enabled.

Any **Issue** produces **Route locked** and disables completion. Select **Review issues** and change the result only after the physical condition has been resolved. If Camera unavailable appears, camera access must be restored before the inspection can finish. Completed inspections are read-only. The wireframe stores a local vehicle cycle and history; it does not create a maintenance task or supervisor override.

## Post-trip inspection

1. After completing Pre-trip, return Home and select **Start** in **Post-trip inspection**. A loaded route is not required.
2. Select **Pass** or **Issue** for all eight checks, including **Company equipment & tools**. Describe each Issue before continuing.
3. Select **Continue to photos**. Capture **Front**, **Rear**, **Driver side**, **Passenger side** and **Dashboard**. All five are required; gallery upload is unavailable.
4. Select **Review inspection** and confirm **I confirm this inspection record is accurate**. If stops have no completed handoff, acknowledge that they remain unfinished and must be reported to dispatch.
5. Select **Complete Post-trip**. An Issue does not prevent submission: the result shows **Completed — issues reported** and **Vehicle needs attention**. Report defects to dispatch; the inspection does not send a message or close orders.
6. **Back to Home** → **Start next vehicle cycle** opens a fresh Pre-trip. The previous pair remains in **Previous vehicle inspections**. A warning reminds you of defects in the previous Post-trip; beginning a new cycle does not confirm repairs.

Drafts and read-only results survive refresh. If saving fails, check device storage and retry; do not leave until the action succeeds. Photos are local capture markers, not real images. Inspection timestamps do not calculate working hours. Pre-trip requires five photos including Dashboard; company equipment is a separate required check from emergency equipment.

## Tasks and Order details

![Tasks list](images/tasks.png)

1. After **Vehicle cleared**, select **Load today’s route** on Home if Today's stops are not shown. This loads a local fixture; it does not connect to Spoke.
2. Open **Tasks**. Search by Order ID or title, or choose All, Pickup or Dropoff.
3. Select the task card to open the correct operation. Select **Order details · Spoke preview** to see the order name, source, quantity, special cargo information and a read-only preview of the route stop.
4. Use the screen's own primary action to save or confirm. Opening a task alone does not mark it complete.

The current Tasks list does not show a universal task-status lifecycle. It shows scheduled stops; Pickup, Dropoff and Order eBOL have separate local states. Avoid interpreting a task row as server assignment or completion.

## Team contacts

Open **Team contacts** from Pickup/Dropoff, or **Order details** from Tasks. The card shows this order's Dispatcher, Broker and Manager, separately from the customer contact. Select **@nickname** to open Telegram; compose and send the message yourself. **Not assigned** means no contact is available for that role.

Check the number, name, quantity, operation, address, scheduled time and handling/order note. If several stops are available, choose **Order stop** first. Select **Copy order summary**, then paste it into your message. If Clipboard is blocked, select and copy the displayed **Order summary** manually. Missing data is shown explicitly; OTP/signatures are not copied.

Names and Telegram handles are unverified sample data: agree recipients before external demonstrations. Opening Telegram depends on the device/browser; no messaging integration is connected.

## Pickup

![Pickup draft](images/pickup.png)

**Purpose:** capture the places and evidence received at Pickup, then confirm the Pickup handoff in Order eBOL.

**When to use:** open a Pickup stop from Home/Tasks or choose Pickup on Home, then select the correct order.

1. Check the **Order #**, operational name and **Order details**. If you need to contact the customer without leaving the order, select **SMS** in the order card; an unread badge shows new replies. If the name or handling details are incomplete, open Order details and fill fields available to your current role.
2. Set Pickup date, responsible manager, packaging and any order comment.
3. For each **dimension group**, enter **Qty**, L/W/H in inches and weight per place in pounds. Groups represent places with the same attributes; each place retains its own PlaceID. Add or remove groups as needed. If a measurement cannot be supplied, mark it or leave it unknown and record **Reason for unmeasured values**. The screen displays known totals separately from incomplete places.
4. Inspect **Cargo photos**. Add with **Take photo** or **Choose from gallery**, select a category and review the thumbnails. An individual photo can be previewed and removed while editing. In this wireframe these actions use local sample assets/metadata.
5. Wait for the draft status to say saved. The form autosaves locally and can be resumed from Home. Correct any **Order data incomplete** or measurement warnings. **Continue to Pickup review** enables only when the Order number, at least one place, at least one photo and required details are present and the draft saved.
6. Select **Continue to Pickup review**. The confirmation page says **Pickup draft ready**. You may open **Place labels** first: choose all, selected or one label, check the preview and select **Print**. If the printer is unavailable, continue to review and use the PlaceID check path.
7. Open **Pickup review**. Check pieces, weight, volume, photos, condition and any exception. Comments are entered during confirmation, not on Review. If evidence changed after review, return and review it again.
8. Choose **Sign on device** or **SMS code** for the Pickup contact. For SMS code, select **Send verification code**, enter the six-digit code supplied by the contact and select **Verify recipient**. In the prototype every six-digit code succeeds except `111111`; three invalid attempts lock verification. Supply contact or driver names as requested. Documented damage/exception requires its note.
9. Select **Continue to signing** for an on-device signature or **Continue to driver signature** after OTP verification. For on-device signing, have the contact sign, optionally request an email copy of this document version, and select **Accept contact signature**. For SMS code, the verified OTP replaces only the contact signature. Have the Zaberman driver sign and select **Confirm & lock Pickup snapshot**.

**Result:** the Pickup snapshot is locked and read-only. An additional place must be entered as **Supplemental Pickup** with a new document version and fresh confirmations. A saved Pickup draft or a “Pickup draft ready” message alone is not the final handoff confirmation. [Pickup source](../../wireframe/src/screens/PickupCaptureScreen.tsx), [review](../../wireframe/src/screens/PickupEbolScreen.tsx), [signing](../../wireframe/src/screens/PickupSignatureScreen.tsx).

## Dropoff

![Dropoff verification](images/dropoff.png)

**Purpose:** compare delivered cargo against Pickup evidence, record condition and confirm the Delivery handoff.

1. Open the Dropoff stop from Home/Tasks or choose **Dropoff** and enter the Order number. Select **Search**. “Order not found” means the current local state has no recorded Pickup for that number.
2. Check the Order name, number of places, weight, volume, Pickup date, responsible manager and Pickup photos. An unfinished Supplemental Pickup must be completed and signed before Delivery can be confirmed.
3. Add **Delivery photos** and compare the cargo against Pickup evidence.
4. Select **Cargo matches pickup photos** only when the comparison is true. Select **No visible damage**, or choose **Report damage instead** and enter **Damage details**. Documented damage does not block the handoff.
5. Select **Confirm Dropoff**. This saves the local Dropoff operation and prepares Delivery evidence. If the Pickup snapshot is not locked, use the offered **Open Pickup review** action first.
6. Open **Delivery review**. Check evidence and exceptions, enter the driver name and choose one contact confirmation method:
   - **Sign on device** — enter the contact name and obtain the contact signature;
   - **SMS code** — select **Send verification code**, ask the recipient for the code sent to the registered masked number, then select **Verify recipient**. In the prototype every six-digit code succeeds except `111111`; three invalid attempts lock verification;
7. For SMS code, the signing action remains disabled until **Recipient verified** appears. For Offline, expired-code or delivery-error states, use the offered retry. If verification is locked, contact dispatch and do not choose a bypass method without approval.
8. Select **Continue to signing** or **Continue to driver signature**. Obtain the required signatures and select **Complete Order eBOL**.
9. Open **View POD**. With SMS code, POD records OTP verification, the recipient name and only the last four phone digits; it does not store the code.

**Result:** Dropoff is locally confirmed at step 5; the Order eBOL becomes completed at step 8. Its POD is a view of that completed document, not a third document. [Dropoff source](../../wireframe/src/screens/DropoffVerifyScreen.tsx), [Delivery review](../../wireframe/src/screens/DeliveryEbolScreen.tsx).

## Comments during signing

These rules apply to Pickup, Supplemental Pickup and Delivery:

- The contact enters an optional **Your comment** on the contact signing screen, before signing. The driver enters their own **Your comment** on the driver signing screen; the contact's comment is read-only there.
- Changing your comment clears your signature: sign again. **Edit contact comment · sign again** returns to the contact step and requires both signatures again.
- With **SMS code**, enter any words relayed by the contact in **Contact comment (reported)** before verifying the code. After verification the field is locked. **Edit contact comment · verify again**, or changing an exception, requires a fresh OTP check. The driver adds their own comment before signing.
- Both fields are optional, up to 1,000 characters each. Drafts save locally; after a refresh the text remains, but on-device signatures must be collected again. If saving fails, keep the screen open and retry before continuing.
- Comments belong only to this document version and become read-only after completion. Damage or disagreement must still be recorded separately as an exception.

## Same Day

The approved process model treats Pickup and Dropoff as separate operations linked to one RouteRun. The active app can show both types of stop on Today's route, but has no routed Same Day progress screen or verified automatic pairing of the two. Complete each stop through its normal Pickup or Dropoff path. Do not assume that finishing Pickup automatically completes or creates a Dropoff task. [Same Day article](../../knowledge-base/mobile-app/same-day.md).

## Customer messages and calls

Open **Messages** from Home, **Message customer** from a task or Order details, or **SMS** from the order card in Pickup draft. Every conversation is tied to one Order and customer contact.

1. In **Messages**, search by Order, customer or message text. Use **All** or **Unread** to narrow the inbox.
2. Open the required conversation and verify the customer, Order and operation in the header. The sender identity is the Zaberman corporate SMS number **17178361039**; the employee's personal phone number is not used or shown.
3. Select a quick message — **On my way**, **Arrived**, **Running late** or **Please confirm access** — or type a custom message. Review the text and select **Send**.
4. Check the status: Sending, Sent, Queued until online or Not sent. Offline messages send automatically after the connection returns. For Not sent, use **Retry**.
5. Incoming replies appear as unread in Messages, the related task and the **SMS** button. Opening the conversation clears its unread count. Use **Open order** to return to the related operation.
6. To call the same customer, select **Call** in the conversation. Confirm the customer, Order and **Calling from** number, then select **Start call**. During a connected call you can toggle **Mute** or **Speaker** and select **End call**. Use **Call again** or **Back to messages** when it ends.

In the current wireframe, SMS and call states are local demonstrations; no telephony provider, audio connection, webhook, push notification or production communication history is connected.

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
| Pre-trip inspection required | Open the Home card and complete all eight checks, five photos including Dashboard and the attestation before loading the route. |
| Route locked / Issue reported | Do not depart. Review the issue and follow the operating team's escalation process; the wireframe has no supervisor override. |
| Camera unavailable during Pre-trip | Restore camera availability; gallery upload cannot replace a required inspection photo. |
| Code not recognized | Recheck the six digits and retry. In the prototype `111111` is always invalid; after three failures contact dispatch. |
| Code expired / SMS could not be delivered | Send a new code or retry SMS. Check connectivity; the registered contact number cannot be edited on Pickup or Delivery review. |
| Verification locked | Do not bypass OTP with another method unless dispatch/supervisor approves it. |
| Camera/scanner/printer unavailable | Use the available manual PlaceID path or continue where the UI offers it. Print and scan hardware are not connected. |
| Scan code unknown or duplicate | Recheck the label/PlaceID. Lookup does not create cargo or record a movement. |
| Missing place at unloading | Review the manifest, continue receiving if appropriate, or explicitly confirm the discrepancy before closing. |
| Offline / sync retry / conflict | More shows local pending status. Retry when online; a conflict scenario offers **Keep local changes**. These are simulated outcomes, not proof of server delivery. |

For a problem without an on-screen resolution, stop before confirming the affected operation and use the team's operational escalation procedure. That procedure is not defined in the prototype and must be provided internally by the operating team.
