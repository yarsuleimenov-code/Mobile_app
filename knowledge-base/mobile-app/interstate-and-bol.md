# Interstate Trips and BOL/eBOL

**Use this article when:** loading places for an Interstate Trip, receiving an incoming Trip or opening its BOL.

## Create a Trip

1. Open **More → Interstate operations**.
2. Choose distinct **Origin warehouse** and **Destination warehouse**, then a truck.
3. Select **Start loading**. Only Pickup-recorded orders matching the direction are eligible.
4. Enter a PlaceID in **Scan or enter Place ID** and choose **Load**, or expand an order and select its places. Use **Load all remaining** only after checking the physical cargo.
5. Select **Review N loaded places**. Verify the selected orders, counts, weight/volume, direction and truck.
6. Select **Create Trip & BOL**.

**Expected result:** the screen shows a TripID and Interstate BOL number. The confirmed set of places forms the Trip manifest.

## Receive a Trip

1. On Interstate operations, open an **Incoming trip**.
2. Enter or select each PlaceID actually received. Check the count against the manifest.
3. Select **Review unloading**. If places are missing, review and explicitly confirm the discrepancies, or return to receiving.
4. Select **Confirm unloading**.

**Expected result:** the local Trip shows **Unloading complete** and its BOL can be opened.

## Find and use the BOL

Choose **Find Interstate BOL** to search by BOL number, TripID, route or truck and filter the archive. Open a document to inspect its status and manifest summary. **Save as PDF** and **Print** invoke the browser print dialog in this build.

**Important:** **Interstate BOL** belongs to one Trip. **Order eBOL** belongs to one Order and tracks Pickup and Delivery confirmations; **POD** is its final view. The active UI does not connect unloading to a subsequent Delivery step. Trips, BOL status and receiving are local simulations, not authoritative server records or production PDFs.

**If something goes wrong:** an order missing from Loading may not have a recorded Pickup or may not match the direction. A missing place at receiving must be handled in the unloading discrepancy review. See [User Guide: Interstate](../../docs/mobile-app/user-guide.md#interstate-and-interstate-bol). Escalation and ownership rules are maintained internally.
