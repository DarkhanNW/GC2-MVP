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

| Stage | Screen | Page elements used, and why those | Endpoint behind it | The number it moves |
| --- | --- | --- | --- | --- |
| Browse | List | Search field, category chips, sort dropdown, result count, and product cards. These let shoppers narrow the catalog, compare prices, and see availability before opening a product. Cards expose image, name, team, price, and status to support the click into Detail. | `GET /api/products` | Click-through to Detail |
| Select | Detail, Cart | Detail: image, title, team/category, price, status badge, description, size buttons with stock states, “Only N left,” disabled sold-out sizes, Add to Cart CTA, and toast. Cart: line items, quantity controls, remove action, subtotal, and checkout CTA. These confirm product details, prevent invalid size choices, and let shoppers review/edit before checkout. | `GET /api/products/:id` | Add-to-cart rate |
| Confirm | Checkout (`checkout.html`) | The customer form collects delivery and contact details, while inline validation messages show which fields need correction. A region dropdown prevents unsupported shipping locations. The order summary shows the estimated product subtotal, shipping fee, and total before purchase. Shipping becomes free (₱0) when the subtotal reaches the selected region's `freeShippingMin` threshold. Customers can choose simulated GCash, Maya, or COD payment. The Place Order button is disabled during submission to prevent duplicate requests. | `GET /api/shipping-tiers` retrieves shipping regions, fees, and free-shipping thresholds. `POST /api/orders` validates customer information, items, and payment method; retrieves current product prices from MongoDB; checks and reduces stock in a transaction; and recalculates the final total using `calculateTotals()`. If there is insufficient stock, the server rejects the request with `409 Conflict`, preventing overselling. | Checkout completion rate — the proportion of customers reaching Checkout who successfully place an order. |
| Save | Confirmation (`confirmation.html`) | The page retrieves and displays the saved order number, purchased products, sizes, quantities, and server-confirmed subtotal, shipping fee, and total. Customers can verify that their order was saved correctly rather than relying on the estimated Checkout total. The Cart is cleared after successful submission to prevent previously purchased items from remaining in it. | `POST /api/orders` creates the order in MongoDB and returns `201 Created`. `GET /api/orders/:id` retrieves the saved order for display on Confirmation. | Completed orders — the number of orders successfully saved. Average order value (AOV) — the average final saved order `total`, including shipping, consistent with `GET /api/metrics`. |


## 4.3 Business rules

| Business rule | Reason | Enforced where (route/function) | What the customer sees when it applies |
| --- | --- | --- | --- |
| Nobody can buy more of a size than we have. | — | `POST /api/orders` (stock check inside the transaction) | Detail shows "Only N left" or disables the size; if stock ran out meanwhile, Checkout shows which item and size and the order is refused (409) |
| Shipping depends on where you live. Fees (ESTIMATES): Metro Manila ₱100, Luzon ₱130, Visayas ₱160, Mindanao ₱180. | — | `calculateTotals()`, reading `shippingTiers` | Checkout shows the shipping fee for the region they pick before they place the order |
| Free shipping for orders with a subtotal of at least ₱5,000. | Most expensive individual items are below ₱5,000, encouraging customers to purchase at least two items to qualify. Our profit on the least profitable qualifying order is ₱1,228; free shipping costs at most ₱180 (15% of it), so the threshold stays at ₱5,000 (see 4.6). | `calculateTotals()` reads `freeShippingMin` from the shipping-tier document. | Shipping shows FREE; below the line, a hint shows how much more to add |
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
Values are from our test orders (MVP, no real sales yet)

| Number | Value from our data | Decision it supports |
| --- | --- | --- |
| Number of orders | 2 | When orders in a week are below 10, as this indicates a low threshold being below the number of unique products,  the owner will post products of choice to promote in related media, like Tiktok and Instagram, as our GC1 target market (18-34, Shopee/IG/Tiktok shoppers), already use these.  |
| Total revenue | ₱4,680 | When revenue since the last restock reaches the total price of 1 QTY ordered per product or more, in this case ₱25,290.00, the owner places the next overseas order, because this ensures that the business has generated sufficient sales to cover the cost of replacing initial product assortment, whilst keeping capital expenditures low. |
| Average order value | ₱2,340 | When average order value stays below ₱5,000, the owner places an option for a number of units for free shipping at checkout, because our free shipping quota is ₱5,000. | 
| Top-selling item | Sunday Showdown Home Jersey (1 sold) | When one item sells 3 units or more within a restocking cycle, the owner prioritizes its' restocking as the 3-per-purchase limit indicates sufficient customer demand if demand for the product is 3 or more. (indicates full-purchase, or purchases between multiple customers sufficiently) |
| Items low on stock | 17 sizes at or below 3; 2 sold out as our test order (MVP) (Cold Front Fleece Hoodie M, Midnight Alternate Jersey M) | When a size reaches our low-stock mark of 3, the owner reorders due to our small order batches. 


## 4.6 Sourcing numbers (special-sourcing requests, #134)

These are the constants behind `quoteRequest()`, `joinPool()` and `poolShipping()` in `server/services/sourcing.js`. All peso figures use **₱60 = US$1** and are rounded to the nearest peso.

### Assumptions

- **Supplier cost.** Licensed NFL wholesale prices are not public (licensed wholesalers sell only to approved retailer accounts), so we estimate supplier cost from retail list prices: **list price ÷ (1 + retailer markup)**, using a retailer markup of 150% on jerseys, 70% on tees and 50% on hoodies (group assumption). Tees and hoodies use licensed MLB items as a price proxy.
- **We sell out-of-season Game jerseys and team gear**, which is why we can buy cheaper from overseas. We apply a **40% off-season discount** to supplier cost, below the 53% clearance discount we found on a licensed jersey listing ($82.64 vs $174.99 list). Our clearance evidence is for a jersey; we assume the same 40% applies to tees and hoodies.
- **Import charges.** Commercial shipments are over the ₱10,000 de minimis, so we pay **15% duty** (knitted apparel, HS chapter 61) and **12% VAT** on goods + freight + duty.
- **Shipping.** Catalog stock and pooled special orders travel together by commercial sea freight (LCL, US$120–180 per CBM, +25% Q4 peak surcharge). A pool rides along with our next merchandise shipment instead of paying the LCL minimum on its own. Customers who choose to wait for a pool are willing to wait for the product, so we use slow, cheap freight.

### Landed cost per item

| | Jersey | Tee | Hoodie |
| --- | --- | --- | --- |
| Retail list price | $130 (Game jersey) | $27.99 | $59.99 |
| Supplier cost (list ÷ (1 + markup)) | ₱3,120 | ₱988 | ₱2,400 |
| After 40% off-season discount | ₱1,872 | ₱593 | ₱1,440 |
| + Overseas freight (pooled, per item) | ₱51 | ₱34 | ₱141 |
| + Duty 15% | ₱288 | ₱94 | ₱237 |
| + VAT 12% | ₱265 | ₱86 | ₱218 |
| **Landed cost, catalog stock** | **₱2,477** | **₱807** | **₱2,036** |
| + Special-order handling (₱760 ÷ 6) | ₱127 | ₱127 | ₱127 |
| **Landed cost, special order** | **₱2,604** | **₱934** | **₱2,163** |

Our current catalog prices in `server/seed.js` stay as they are: every item sells above its landed cost (jerseys ₱623–923 profit, tees ₱383–643, hoodies ₱614–914).

### Overseas shipping per item: `shippingSolo` vs `shippingPooled`

| Category | `shippingSolo` | `shippingPooled` |
| --- | --- | --- |
| `jerseys` | ₱3,300 | ₱51 |
| `tees` | ₱3,300 | ₱34 |
| `hoodies` | ₱4,200 | ₱141 |

- **Solo** is what one item costs to ship from the US alone by economy post: US$40–55 for 0.5 kg (tee, jersey) and US$55–70 for 1 kg (packed hoodie). We use the high end of each range because we buy in Q4 peak season, a bulky hoodie is billed by volume, and we would rather overstate the cost than understate it. Solo is display only: no customer pays it.
- **Pooled** is the item's share of our sea-freight shipment by volume (our estimates: tee ≈ 0.003 CBM, jersey ≈ 0.0045 CBM, hoodie ≈ 0.0125 CBM packed, at US$150/CBM + 25% Q4). It is included in `quotedPrice`.

### `POOL_TARGET` = 6

Each special order has a fixed cost that does not depend on quantity:

| Fixed cost per special order | ₱ |
| --- | --- |
| Our time: finding, ordering and tracking the item (estimate: 2 hrs at the NCR minimum wage, ₱755 ÷ 8) | 189 |
| US parcel from the supplier to our forwarder (USPS Ground Advantage, 1 lb, US$8.74) | 524 |
| Customs brokerage (rides in the merchandise shipment, which already pays one entry fee) | 0 |
| Receiving and sorting the special order in Manila (estimate: 0.5 hr) | 47 |
| **Total** | **760** |

We let each item carry ₱150 of that cost: ₱760 ÷ ₱150 = 5.07, rounded up to **6**. Six is a balance between saving costs and how long customers wait for demand to build. We also only order once the pool fills, so we never buy stock nobody committed to. Customers pay when the pool reaches its target (no deposit).

### `quotedPrice` per category

**`quotedPrice` = our featured catalog price + a ₱300 convenience fee.** Special orders are anchored to the catalog price customers already know (our featured item in each category). The ₱300 fee pays for pre-ordering an item we do not stock, with no deposit; special items are also likely to be in higher demand. It is about double the ₱127 extra handling a special order costs us.

| Category | Featured catalog price | `quotedPrice` | Landed (special order) | Profit per item |
| --- | --- | --- | --- | --- |
| `jerseys` | ₱3,200 (Sunday Showdown Home) | **₱3,500** | ₱2,604 | ₱896 |
| `hoodies` | ₱2,800 (Endzone Pullover) | **₱3,100** | ₱2,163 | ₱937 |
| `tees` | ₱1,250 (Tailgate Graphic) | **₱1,550** | ₱934 | ₱616 |

**Our advantage over buying direct.** A fan buying the same item alone from the US pays the list price plus solo shipping: about ₱11,100 for a Game jersey (₱7,800 + ₱3,300), ₱7,799 for a hoodie and ₱4,979 for a tee. Each single item is under the ₱10,000 de minimis, so the fan pays no duty or VAT on it; our customer pays ₱3,500, ₱3,100 and ₱1,550, saving ₱7,600, ₱4,699 and ₱3,429 per item (before local delivery, which both pay). The saving comes from two things: pooled shipping (₱34–141 per item instead of ₱3,300–4,200) and buying out-of-season stock at a discount. Caveat: if the item is sold by a retailer that offers free international shipping to the Philippines (Amazon has offered this on eligible items for orders of US$49 or more), the fan's shipping cost drops to ₱0 and the saving is only the price difference (₱7,800 vs ₱3,500 for a jersey). That is what a Shopee seller handling requests one by one cannot match: we pool demand and buy off-season, so we price below what a fan pays importing alone.

### Decision with a number: free-shipping threshold

| Qualifying basket (≥ ₱5,000) | Subtotal | Profit | After ₱180 free shipping |
| --- | --- | --- | --- |
| 2 × Sideline Zip hoodie (lowest profit) | ₱5,300 | ₱1,228 | ₱1,048 |
| Retro jersey + Sideline Zip hoodie | ₱5,750 | ₱1,237 | ₱1,057 |
| Sideline Zip hoodie + 2 × Fourth Quarter tee | ₱5,030 | ₱1,380 | ₱1,200 |
| 4 × Tailgate tee (2 sizes) | ₱5,000 | ₱1,772 | ₱1,592 |

Our profit on the least profitable qualifying order is ₱1,228; free shipping costs at most ₱180 (15% of it), so the threshold stays at ₱5,000.
