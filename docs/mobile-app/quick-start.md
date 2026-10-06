# Quick Start

Use this as a short guide to the current Mobile App interface. The deployed build is a business prototype: tasks and external actions are simulated and saved in this browser.

## Before you start

Open **Cargo operations**. Before **Load today’s route** becomes available, complete the required **Pre-trip inspection**. Pickup and Dropoff can still be opened directly in the wireframe. A loaded Spoke route is a local fixture, not a live dispatch assignment.

## Complete the Pre-trip inspection

1. On Home, select **Start** in the Pre-trip inspection card for **Van 08 · Extended Van**.
2. Answer all eight safety checks with **Pass** or **Issue**.
3. Select **Continue to photos** and take the required Front, Rear, Driver side, Passenger side and Dashboard photos. Gallery upload is not available.
4. Review the inspection and confirm **I confirm this vehicle is safe to operate**.
5. Select **Complete inspection**. Home shows **Vehicle cleared**, and the route can be loaded.

Any **Issue** keeps the route locked. Use **Review issues**, correct the answer only after the condition is resolved, or follow the operating team's escalation process. Camera unavailable also prevents completion.

## Finish vehicle use

Home → **Post-trip inspection** → eight checks (describe every Issue) → five photos including Dashboard → Review and driver attestation → **Complete Post-trip**. Acknowledge any unfinished stops. Issues are recorded without blocking submission. Home → **Start next vehicle cycle** requires a fresh Pre-trip and keeps the previous pair in history. See [Post-trip instructions](user-guide.md#post-trip-inspection).

## Main navigation

- **Home:** compact **Manual operations → Pickup / Dropoff**, Today's stops, drafts and Order documents. For additional places on a signed Pickup, use **Recent operations → Add places** or resume **Supplemental Pickup** from **Pickup drafts**.
- **Tasks:** search by Order ID/title; filter Pickup or Dropoff; open the correct stop.
- **Scan:** look up a cargo PlaceID or Order ID.
- **More:** Help & Instructions, Cargo places, Interstate operations and local sync status.

## Open a task

In **Tasks**, choose a stop. Check its Order number, scheduled time and address. Use **Order details · Spoke preview** if the order name or handling information needs review. Opening a stop does not complete it.

**Order details** is a compact link beside a customer-message icon in Tasks. Drivers read the summary and contacts without edit fields; expand **Additional details** for External name/Source. Handling requirements remain visible.

## Navigate

Check the stop's full address on Home, Tasks, Pickup/Dropoff or Order details and select **Navigate** to open Google Maps. **Copy address** copies only the address; a manual-copy field appears if Clipboard is blocked. Select the stop first if several are available. Opening Maps does not complete the stop. If draft saving fails, retry before leaving the form. Driving directions do not guarantee truck-safe routing.

## Team contacts

Open **Order details** in Pickup/Dropoff or Tasks and find **Team contacts** below the stop summary. Check the order/stop, select **Copy summary**, then paste into a message. Open the required Dispatcher/Broker/Manager **@nickname** in Telegram; nothing is sent automatically. If Clipboard is blocked, copy the displayed text manually. Sample Telegram recipients must be agreed before external demonstrations.

## Message or call a customer

Open **Messages** from Home, **Message customer** from a task or Order details, or **SMS** in the Pickup draft order card. Confirm the customer and Order, choose a quick message or type your own, then select **Send**. A queued message will send when the connection returns; use **Retry** if it shows **Not sent**. Messages are sent from corporate number **17178361039**, not the employee's personal number.

For a call, open the customer's conversation, select **Call**, confirm the Order and corporate **Calling from** number, then select **Start call**. End with **End call** and return through **Back to messages**. The current build demonstrates the call flow but does not connect audio or a telephony provider.

## Complete Pickup

1. Confirm the Order number and operational name.
2. Enter each dimension group's **Qty**, L/W/H and weight per place. Add a reason for unknown measurements.
3. Add at least one cargo photo. Wait for the draft to save.
4. Select **Continue to Pickup review**. Print/check place labels if needed.
5. Review evidence and exceptions. Choose **Sign on device** or **SMS code**. Each party adds an optional **Your comment** on their own signing screen. With SMS code, record **Contact comment (reported)** before verification; the driver comments on their signing screen. Select **Send verification code**, enter the contact's six-digit code and select **Verify recipient**. In the prototype every six-digit code succeeds except `111111`.
6. Complete the contact confirmation. Select **Continue to signing** for an on-device signature or **Continue to driver signature** after OTP verification. Obtain the Zaberman driver signature and select **Confirm & lock Pickup snapshot**.

The first confirmation screen means the draft is ready; the Pickup handoff is locked only after signing.

## Complete Dropoff

1. Open the Dropoff stop or search its Order number.
2. Compare places and Pickup photos with delivered cargo.
3. Add at least one Delivery photo. Mark **Cargo matches pickup photos** and either **No visible damage** or **Report damage instead** with details.
4. Select **Confirm Dropoff**, then **Open Delivery review**. If prompted, lock Pickup first.
5. Review evidence and choose **Sign on device** or **SMS code** for the contact. For SMS code, send the code to the displayed masked number and enter the recipient's code. In the prototype, every six-digit code succeeds except `111111`, which demonstrates an invalid code.
6. Obtain the driver signature, select **Complete Order eBOL** and open POD.

## Scan cargo

Open **Scan** and use **Scan label** or **Enter code manually**. A found PlaceID opens its cargo record; an Order ID opens its places. Main Scan is lookup only. For Interstate movement, use the PlaceID inputs inside Loading or Unloading.

## If something is wrong

Do not confirm an incorrect order or cargo match. Correct a draft before signing; after Pickup is locked, use Supplemental Pickup for added places. An unknown scan creates nothing. Record damage with details rather than marking no damage. If the screen blocks completion, follow its warning and return to the missing step. For a situation without a documented path, escalate through your operational lead.

See the [full User Guide](user-guide.md) for Interstate, documents and exception details.
