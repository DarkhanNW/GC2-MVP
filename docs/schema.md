# Data schema

MongoDB Atlas, accessed through Mongoose. Three collections. Change this only through an Issue titled `Contract change: …`.

## products

| Field | Type | Rules |
| --- | --- | --- |
| `_id` | ObjectId | Set by MongoDB |
| `name` | String | Required, e.g. "Sunday Showdown Home Jersey" |
| `slug` | String | Required, unique, lowercase with dashes |
| `category` | String | Required, one of `jerseys`, `hoodies`, `tees` (shown as Team Jerseys, Hoodies & Fleece, Tees & Tops) |
| `team` | String | Required, NFL team name |
| `price` | Number | Required, whole pesos, greater than 0 |
| `description` | String | |
| `image` | String | Path or URL to the product image |
| `featured` | Boolean | Default `false`; featured items appear on Home |
| `preOrder` | Boolean | Default `false`; shown with a Pre-Order badge |
| `sizes` | Array of `{ size: String, stock: Number }` | At least one entry; `size` one of `S`, `M`, `L`, `XL`, `XXL`; `stock` a whole number ≥ 0 |
| `lowStockAt` | Number | Default `3`; a size at or below this shows "Only N left" |
| `createdAt`, `updatedAt` | Date | Mongoose timestamps |

Stock is tracked **per size**, because a customer buys a size, and a jersey can be sold out in M while L is still available.

## orders

| Field | Type | Rules |
| --- | --- | --- |
| `_id` | ObjectId | Set by MongoDB; used in `/api/orders/:id` |
| `orderNo` | String | Required, unique, human-friendly, e.g. `100Y-20261105-0042` |
| `customer.name` | String | Required |
| `customer.mobile` | String | Required, PH mobile format `09XXXXXXXXX` |
| `customer.email` | String | Required, valid email |
| `customer.street` | String | Required |
| `customer.city` | String | Required |
| `customer.province` | String | Required |
| `customer.region` | String | Required, must match an active `shippingTiers.region` |
| `items` | Array | At least one line |
| `items[].productId` | ObjectId → products | Required |
| `items[].name` | String | Copied from the product at the time of the order |
| `items[].size` | String | Required |
| `items[].qty` | Number | Whole number, 1 to the per-line maximum |
| `items[].unitPrice` | Number | Copied from the product price at the time of the order (so later price changes don't rewrite old orders) |
| `items[].lineTotal` | Number | `unitPrice × qty`, computed by the server |
| `subtotal` | Number | Sum of `lineTotal`, computed by the server |
| `shippingFee` | Number | From the customer's tier, `0` when the subtotal reaches that tier's free-shipping line |
| `total` | Number | `subtotal + shippingFee` |
| `paymentMethod` | String | One of `gcash`, `maya`, `cod` (simulated, no real payment) |
| `status` | String | Default `pending`. Later statuses (`paid`, `shipped`, `delivered`) come in the Final Project |
| `createdAt` | Date | Mongoose timestamps |

## shippingTiers

| Field | Type | Rules |
| --- | --- | --- |
| `_id` | ObjectId | Set by MongoDB |
| `region` | String | Required, unique: `Metro Manila`, `Luzon`, `Visayas`, `Mindanao` |
| `fee` | Number | Shipping fee in pesos for this region |
| `freeShippingMin` | Number | Subtotal at or above which shipping is free; `0` means no free shipping for this region |
| `active` | Boolean | Default `true`; inactive regions can't be chosen at checkout |

Keeping fees and the free-shipping line in this collection means the owner changes a rule in **one place** (Challenge 4): the totals code reads them; nothing is hard-coded.

## How they connect

- An order line points to a product (`items[].productId`) and copies its name and price at that moment.
- An order's `customer.region` must match a `shippingTiers.region`.
- Saving an order and reducing `products.sizes[].stock` happen in **one MongoDB transaction**: either both happen or neither does.

## sourcingRequests

A customer's request for an item we don't stock. Prices and pool logic live in `server/services/sourcing.js` (`quoteRequest()`, `joinPool()`); the server never takes `quotedPrice`, `poolKey`, `status` or `poolFilledAt` from the browser.

| Field | Type | Set by | Rules |
| --- | --- | --- | --- |
| `_id` | ObjectId | MongoDB | Used in `/api/sourcing-requests/:id` |
| `customer.name` | String | Browser | Required |
| `customer.mobile` | String | Browser | Required, PH mobile format `09XXXXXXXXX` (same rule as orders) |
| `customer.email` | String | Browser | Required, valid email (same rule as orders) |
| `customer.region` | String | Browser | Required, must match an active `shippingTiers.region` (same rule as orders). Sets the local delivery fee, charged when the request is `ready` |
| `team` | String | Browser | Required, one of the 32 NFL team slugs in `server/nflTeams.js`, e.g. `philadelphia-eagles`. Player names, numbers and editions go in `details` |
| `category` | String | Browser | Required, one of `jerseys`, `hoodies`, `tees` (`server/productCategories.js`) |
| `size` | String | Browser | Required, one of `S`, `M`, `L`, `XL`, `XXL` |
| `qty` | Number | Browser | Whole number, 1 to 3 (same per-line max as orders). Each unit takes one spot in the pool |
| `details` | String | Browser | Optional, at most 500 characters (player, number, edition, colour, link to a photo) |
| `maxPrice` | Number | Browser | Required, whole pesos > 0: the most the customer will pay per item |
| `quotedPrice` | Number | Server | Our price per item for that `category`, from the price table in `services/sourcing.js`. Set on every request, including declined ones (it is the counter-offer). What the customer pays if accepted; includes overseas shipping at the pooled rate (`shippingPooled`), but not local delivery. Never taken from the browser |
| `poolKey` | String | Server | `<team>\|<category>`, e.g. `philadelphia-eagles\|jerseys`. Size is not part of the key (one supplier order can mix sizes). Set on every request; only `pooling` requests count toward the pool |
| `status` | String | Server | One of `declined`, `pooling`, `ordered`, `ready`, `completed`, `cancelled`. On create, `quoteRequest()` decides: `maxPrice` ≥ `quotedPrice` → `pooling` (or `ordered` if this request fills the pool); below → `declined`. Any `status` sent on create is ignored. Owner changes via PATCH: `ordered → ready → completed`, `pooling → cancelled` |
| `statusNote` | String | Server (owner may override on PATCH) | Message shown on the customer's status page, e.g. declined: "Lowest we can do is ₱3,600"; pooling: "Waiting for the pool to fill"; ordered: "Pool filled, ordered from our supplier. Wait for shipping"; ready: "Arrived, we'll contact you"; cancelled: "Request cancelled" |
| `poolFilledAt` | Date | Server | Stamped on every request in the pool, with the same time, when the pool fills (including the request that filled it). Absent otherwise |
| `createdAt` | Date | Mongoose | Timestamps |

**Computed on read, not stored:** `pool: { joined, target, shippingSolo, shippingPooled }`. `joined` is the total `qty` of `pooling` requests with the same `poolKey`; `target` is `POOL_TARGET` in `services/sourcing.js`; `shippingSolo` and `shippingPooled` are the overseas shipping cost per item for that `category` when ordered alone vs in a full pool (at `target`), from `poolShipping(category)` in `services/sourcing.js`. `shippingPooled` is already included in `quotedPrice`, so these two are for display only. `pool` is included only when `status` is `pooling`; null or omitted otherwise.
