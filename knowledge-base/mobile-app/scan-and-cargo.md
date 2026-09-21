# How to Scan and Handle Cargo

**Use this article when:** you need to identify a place, inspect its record, print its label, or account for it during an Interstate Trip.

## Understand a place

The Pickup form groups places with the same dimensions and weight per place. **Qty** is the count in a group; every physical place still has its own **PlaceID**. **More → Cargo places** lets you search a PlaceID, Order or location and open the place's label, status and short event history. The current wireframe label is Code 128 with a readable PlaceID.

## Look up a place

1. Open the bottom **Scan** tab.
2. Select **Scan label** when available, or **Enter code manually**.
3. Enter a PlaceID or Order ID and select **Find**.
4. Open the found place or the order's place list.

**Expected result:** the app displays the matching place/order. A repeated code in this visit says **Already scanned this visit**; an unknown code says **Code not found**. Neither result creates or moves cargo.

## Print or reprint a label

After saving Pickup, choose **Open place labels**. Select all, selected labels or one label, inspect the preview and choose **Print**. You can then check a PlaceID in Scan. Reprint keeps the same PlaceID in this wireframe.

## Record loading or receiving

The main Scan tab only looks up cargo. To change a Trip manifest, open **More → Interstate operations → Start loading** and use **Scan or enter Place ID** or select places. For an incoming Trip, open its Unloading screen and use **Scan or enter Place ID** or select received places.

**Important:** current camera/scanner/print actions and history are simulations. A QR-specific scan workflow is not shown. The future product ID contract differs from the readable wireframe PlaceID; use the code displayed in this build.

**If something goes wrong:** recheck the number and use manual entry. If a place is absent from an Interstate manifest, stop and use the screen's missing-place discrepancy step; do not mark another place as received. See the [User Guide](../../docs/mobile-app/user-guide.md#cargo-scan-and-labels).
