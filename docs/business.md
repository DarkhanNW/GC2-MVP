# Business case — 100-Yard Apparel

> **Draft for CP0.** Section 4.1 quotes our GC1 proposal and maps each part to what we plan to build. Section 4.3 lists the rules we will enforce; the numbers marked _TBD_ are ours to decide as a group, with our reasons. Sections 4.2, 4.4 and 4.5 are filled in once the build exists. The reasoning in this file must be our own (AI-use policy rule 6).

## 4.1 GC1 traceability

| From GC1 | What we wrote in GC1 | Where it shows up in the build |
| --- | --- | --- |
| Target market | "Young adults, ages 18-34 years old, primarily Gen Z and younger Millennials … fans of the National Football League (NFL), earn between Php 20,000 - Php 60,000 in monthly personal income, and are based in … Metro Manila, Cebu and Davao … comfortable buying through online channels such as Shopee, Lazada, Ebay, Instagram, and Tiktok." | Phone-first layout, because this group shops on Shopee, Lazada and TikTok from their phones. Prices in pesos with no conversion. GCash, Maya and COD as payment choices, the methods this market already uses. Shipping regions cover Metro Manila, Cebu (Visayas) and Davao (Mindanao). |
| Problem statement | "NFL apparel and merchandise are difficult to purchase locally due to an unserviced market, often requiring international shipping from 3rd party commerce … there is a heavy lack of specialized local competitors." | The whole Browse → Save flow is local: the customer checks out in pesos and gets a Philippine shipping fee, with no foreign site or customs. Stock shown per size before they pay (Detail). |
| Value proposition | "Make popular NFL apparel more accessible, affordable, and locally available to Filipino fans … mix the themes of team pride and everyday-street wear." Homepage line: "The NFL gear your city doesn't stock." | Read on Home (headline and tagline "Built for the Bowl"). Experienced on List (categories Team Jerseys, Hoodies & Fleece, Tees & Tops; search by team) and on Checkout (local shipping fee shown before the order is placed). |
| Monetization model | "Direct sales or markup model … Multiple revenues … will come from pre-order fees and special sourcing commissions, premium packages on limited offers and transparent shipping costs." | Money is computed in `calculateTotals()` (`server/services/totals.js`), called by `POST /api/orders`: product price × quantity plus the region's shipping fee. Product prices carry our markup. Revenue reported on the owner screen from `GET /api/metrics`. |
| Core platform features | A. Product catalog with details | Built now: List and Detail screens, `GET /api/products`, `GET /api/products/:id` |
| | B. Search and filter by price, color, team and size | Built now: search (`?q=`, matches team), category filter, sort by price. Filter by color and size: Final Project |
| | C. Choose sizes, colors and variations | Built now: size selection on Detail. Colors: Final Project |
| | D. Availability shown in real time | Built now: per-size stock and In Stock / Low Stock / Sold Out badges from the server (revenue feature 1) |
| | E. Cart and checkout | Built now: Cart, Checkout, Confirmation screens; `POST /api/orders` |
| | F. Secure accounts | Final Project (login is out of GC2 scope) |
| | G. Online payment (QRPH, PayMaya) | Simulated payment choice now; real gateway in the Final Project |
| | H. Order tracking | Orders saved with status `pending` now; tracking timeline in the Final Project |
| | I. Admin stock tracking | Built now: owner screen with orders list and low-stock items (`GET /api/metrics`) |
| | J. Pre-order system | Partly: pre-order items are labelled; full pre-order flow in the Final Project |
| | K. Back-in-stock notifications | Final Project |

## 4.2 Funnel map

_To fill in once the screens exist (owners: M4 for Browse and Select, M5 for Confirm and Save). For each element, say why it is the right one for the job._

| Stage | Screen | Page elements used, and why those | Endpoint behind it | The number it moves |
| --- | --- | --- | --- | --- |
| Browse | List | Search field, category chips, sort dropdown, result count, and product cards. These let shoppers narrow the catalog, compare prices, and see availability before opening a product. Cards expose image, name, team, price, and status to support the click into Detail. | `GET /api/products` | Click-through to Detail |
| Select | Detail, Cart | Detail: image, title, team/category, price, status badge, description, size buttons with stock states, “Only N left,” disabled sold-out sizes, Add to Cart CTA, and toast. Cart: line items, quantity controls, remove action, subtotal, and checkout CTA. These confirm product details, prevent invalid size choices, and let shoppers review/edit before checkout. | `GET /api/products/:id` | Add-to-cart rate |
| Confirm | Checkout | | `GET /api/shipping-tiers`, `POST /api/orders` | Checkout completion |
| Save | Confirmation | | `GET /api/orders/:id` | Orders, average order value |

## 4.3 Business rules

| Business rule | Reason | Enforced where (route/function) | What the customer sees when it applies |
| --- | --- | --- | --- |
| Nobody can buy more of a size than we have. | — | `POST /api/orders` (stock check inside the transaction) | Detail shows "Only N left" or disables the size; if stock ran out meanwhile, Checkout shows which item and size and the order is refused (409) |
| Shipping depends on where you live. Fees (ESTIMATES): Metro Manila ₱100, Luzon ₱130, Visayas ₱160, Mindanao ₱180. | — | `calculateTotals()`, reading `shippingTiers` | Checkout shows the shipping fee for the region they pick before they place the order |
| Free shipping for orders with a subtotal of at least ₱5,000. | Most expensive individual items are below ₱5,000, encouraging customers to purchase at least two items to qualify. | `calculateTotals()` reads `freeShippingMin` from the shipping-tier document. | Shipping shows FREE; below the line, a hint shows how much more to add |
| Up to 3 of one item and size per order. | Stock arrives in small imported batches; this limits scalpers while accommodating families or friends buying as a group. | `POST /api/orders` validation | Quantity control stops at the limit; the server refuses more with 400 |
| We only deliver within the Philippines. | — | `POST /api/orders` validation (region must be an active tier) | Region is a dropdown of our four regions; anything else is refused with 400 |
| If a size is running low, say so. Low-stock mark: 3 units. | — | Product `status` computed in `GET /api/products` and `/:id` | Low Stock badge on List; "Only N left" on Detail |
| Prices are ours, not the browser's. | — | `calculateTotals()` uses database prices only | The total on Confirmation is the server's total, even if the page showed something else |

### Free-shipping threshold: change locations

The owner can change the free-shipping threshold by editing the `freeShippingMin` value on the relevant documents in the MongoDB Atlas `shippingTiers` collection. The change applies to the next order without requiring a redeployment.

The `FREE_SHIPPING_MIN` constant in `server/seed.js` (line 163) provides the default threshold of ₱5,000 when creating a fresh database. Rerunning `seed.js` resets all four region documents to this default, so it should not be rerun just to change the threshold in an existing database.

Setting `freeShippingMin` to `0` disables free shipping for that region.

**Before this PR:** The ₱5,000 threshold was hardcoded separately in `server/seed.js`:

- `server/seed.js:164` — Metro Manila
- `server/seed.js:165` — Luzon
- `server/seed.js:166` — Visayas
- `server/seed.js:167` — Mindanao

**After this PR:** The four region entries use one shared default:

- `server/seed.js:163` — `const FREE_SHIPPING_MIN = 5000;`

See [PR #83 – Centralize Free Shipping Threshold](https://github.com/DarkhanNW/GC2-MVP/pull/83).

## 4.4 Revenue features, with a number

### Feature 1: Inventory Counter

The inventory counter tracks available stock for each product size. Based on our seeded inventory, Sunday Showdown Home Jersey is priced at ₱3,200, with 2 units remaining in size M. The system identifies this as low stock because our threshold is 3 units.

For example, if a customer successfully orders 1 size M jersey:

- Product price: ₱3,200
- Initial size M stock: 2 units
- Quantity ordered: 1 unit
- Remaining size M stock: 1 unit
- Updated total product stock: 20 units

So, the inventory counter updates stock after a successful order and helps prevent customers from purchasing more units than are available.

### Feature 2: Tiered Shipping by Region

Our shipping fees depend on the customer's delivery region. Metro Manila has a ₱100 fee, Luzon ₱130, Visayas ₱160, and Mindanao ₱180. Orders with a subtotal of ₱5,000 or more qualify for free shipping.

For example, a customer from Metro Manila orders:

- 1 Sunday Showdown Home Jersey: ₱3,200
- 1 Endzone Pullover Hoodie: ₱2,800
- Subtotal: ₱6,000
- Shipping fee: FREE
- Final order total: ₱6,000

For comparison, purchasing only the jersey would result in a ₱3,200 subtotal plus ₱100 shipping, giving a total of ₱3,300.

So, the free-shipping threshold affects the final amount customers pay, while regional shipping rates determine the additional cost for orders below the threshold.

## 4.5 What the owner does with the numbers

_To fill in once the owner screen works (owner: M6). One decision per number._

| Number | Value from our data | Decision it supports |
| --- | --- | --- |
| Number of orders | | |
| Total revenue | | |
| Average order value | | |
| Top-selling item | | |
| Items low on stock | | |
