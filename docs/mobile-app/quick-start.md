# Quick Start

Use this as a short guide to the current Mobile App interface. The deployed build is a business prototype: tasks and external actions are simulated and saved in this browser.

## Before you start

Open **Cargo operations**. Before **Load today’s route** becomes available, complete the required **Pre-trip inspection**. Pickup and Delivery can still be opened directly in the wireframe. A loaded Spoke route is a local fixture, not a live dispatch assignment.

## Complete the Pre-trip inspection

1. Select **Start** on the Home Pre-trip card.
2. Capture the vehicle from four sides and the dashboard. Enter the odometer in miles and select **Continue to equipment**.
3. Capture eight equipment photos, select **Review inspection**, then attest and select **Complete inspection**. Home allows route loading.

## Finish vehicle use

If you used a route, select **Complete route** on Home when you return to the warehouse. Open **Post-trip inspection** separately. Capture the same 13 photos, enter the ending odometer, review the trip distance if both readings are available and select **Complete Post-trip**. **Start next vehicle cycle** archives the pair. [Post-trip instructions](user-guide.md#post-trip-inspection).

## Load the next warehouse route

Open **Route Loading** on Home to preview the next route. Select **Start loading**, then scan or enter each expected Delivery **PlaceID**. Select **Complete loading** after all places are confirmed. [Route Loading instructions](user-guide.md#route-loading).

## Sync after reconnecting

Select **More → Sync now** when the connection returns. Open **Queue details** to check the result. If a record shows **Retry needed**, select **Sync now** again. [Sync instructions](user-guide.md#sync-saved-changes).

## Main navigation

- **Home:** compact **Manual operations → Pickup / Delivery**, Today's stops, drafts and Order documents. For additional places on a signed Pickup, use **Recent operations → Add places** or resume **Supplemental Pickup** from **Pickup drafts**.
- **Tasks:** search by Order ID/title; filter Pickup or Delivery; open the correct stop.
- **Scan:** look up a cargo PlaceID or Order ID.
- **More:** Help & Instructions, Cargo places, Interstate operations and local sync status.

## Open a task

In **Tasks**, choose a stop. Check its Order number, scheduled time and address. Use **Order details · Spoke preview** if the order name or handling information needs review. Opening a stop does not complete it.

**Order details** is a compact link beside a customer-message icon in Tasks. Drivers read the summary and contacts without edit fields; expand **Additional details** for External name/Source. Handling requirements remain visible.

## Navigate

Check the stop's full address on Home, Tasks, Pickup/Delivery or Order details and select **Navigate** to open Google Maps. **Copy address** copies only the address; a manual-copy field appears if Clipboard is blocked. Select the stop first if several are available. Opening Maps does not complete the stop. If draft saving fails, retry before leaving the form. Driving directions do not guarantee truck-safe routing.

## Team contacts

Open **Order details** in Pickup/Delivery or Tasks and find **Team contacts** below the stop summary. Check the order/stop, select **Copy summary**, then paste into a message. Open the required Dispatcher/Broker/Manager **@nickname** in Telegram; nothing is sent automatically. If Clipboard is blocked, copy the displayed text manually. Sample Telegram recipients must be agreed before external demonstrations.

## Message or call a customer

Open **Inbox → Messages** from Home or the bottom navigation, **Message customer** from a task or Order details, or **SMS** in the Pickup draft order card. Confirm the customer and Order. The first template, **We'll be there in 20 minutes**, fills the editor; change the minutes/text if needed and select **Send**. It is not sent automatically. Other templates and custom text remain available. A queued message will send when the connection returns; use **Retry** for **Not sent**. The sender is corporate number **17178361039**, not the employee's personal number.

For a call, select **Call** in the conversation or **Inbox → Calls → Call back**; **Missed** filters missed calls. Confirm the Order, Route date and corporate **Calling from** number, then select **Start call**. Choose an Order if several match. End with **End call** and return through **Back to messages** or **Back to calls**. Viewing Calls clears the new indicator but keeps missed records. Offline history is readable; Start is unavailable. Calls/history are local demonstrations without audio or a telephony provider.

## Complete Pickup

1. Confirm the Order number and operational name. At an assigned stop, select **Start Pickup** when work begins.
2. Enter each dimension group's **Qty**, L/W/H and weight per place. Add a reason for unknown measurements.
3. Add at least one cargo photo. Wait for the draft to save.
4. Select **Continue to Pickup review**. Print/check place labels if needed.
5. Review evidence and exceptions. Choose **Sign on device** or **SMS code**. Each party adds an optional **Your comment** on their own signing screen. With SMS code, record **Contact comment (reported)** before verification; the driver comments on their signing screen. Select **Send verification code**, enter the contact's six-digit code and select **Verify recipient**. In the prototype every six-digit code succeeds except `111111`.
6. Complete the contact confirmation. Select **Continue to signing** for an on-device signature or **Continue to driver signature** after OTP verification. Obtain the Zaberman driver signature and select **Confirm & lock Pickup snapshot**.

At an assigned stop, select **Complete stop** after confirming the handoff. Use **Add packing photos** on the signed Pickup or in **Order details** to add optional packing photos later.

## Complete Delivery

1. Open the Delivery stop or search its Order number. At an assigned stop, select **Start Delivery** when work begins.
2. Compare places and Pickup photos with delivered cargo.
3. Add at least one Delivery photo, or if you find damage, select **Record damage**, add a damage photo and describe it.
4. Select **Continue to Delivery review**, then **Open Delivery review**. If prompted, lock Pickup first.
5. Review evidence and choose **Sign on device** or **SMS code** for the contact. For SMS code, send the code to the displayed masked number and enter the recipient's code. In the prototype, every six-digit code succeeds except `111111`, which demonstrates an invalid code.
6. Obtain the driver signature, select **Complete Order eBOL** and open POD.
7. At an assigned stop, select **Complete stop** after confirming the handoff.

## Scan cargo

Open **Scan** and use **Scan label** or **Enter code manually**. A found PlaceID opens its cargo record; an Order ID opens its places. Main Scan is lookup only. For Interstate movement, use the PlaceID inputs inside Loading or Unloading.

## If something is wrong

Do not confirm an incorrect order or cargo match. Correct a draft before signing; after Pickup is locked, use Supplemental Pickup for added places. An unknown scan creates nothing. Record damage with details rather than marking no damage. If the screen blocks completion, follow its warning and return to the missing step. For a situation without a documented path, escalate through your operational lead.

See the [full User Guide](user-guide.md) for Interstate, documents and exception details.
