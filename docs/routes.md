# Route table

This is the contract between the front end and the back end. Change it only through an Issue titled `Contract change: …`.

All routes return JSON. Every error response has the shape:

```json
{ "error": "Human-readable message", "field": "optionalFieldName" }
```

## Summary

| Method | Route | Purpose | Status codes | Owner |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | Server and database status | 200 | M1 |
| GET | `/api/products` | List for browsing, with search, filter and sort | 200 (empty list is still 200) · 400 | M2 |
| GET | `/api/products/:id` | One product for Detail | 200 · 404 | M2 |
| GET | `/api/shipping-tiers` | Regions and fees for the checkout preview | 200 | M3 |
| POST | `/api/orders` | Validate, recompute total, reduce stock, save | 201 · 400 · 404 · 409 | M3 |
| GET | `/api/orders/:id` | Read an order back for Confirmation | 200 · 404 | M3 |
| GET | `/api/orders` | All saved orders for the owner screen | 200 | M6 |
| GET | `/api/metrics` | The five owner numbers | 200 | M6 |

## Details

### GET /api/products

Query strings (all optional, combinable):

| Param | Example | Effect |
| --- | --- | --- |
| `q` | `?q=steelers` | Case-insensitive match on name, team or description |
| `category` | `?category=jerseys` | One of `jerseys`, `hoodies`, `tees`; other values return 400 |
| `sort` | `?sort=price_asc` | `price_asc`, `price_desc` or `newest` (default); other values return 400 |

Response `200`:

```json
[
  {
    "_id": "6650f1…",
    "name": "Primetime Away Jersey",
    "slug": "primetime-away-jersey",
    "category": "jerseys",
    "team": "Pittsburgh Steelers",
    "price": 3200,
    "image": "/img/primetime-away-jersey.jpg",
    "featured": true,
    "preOrder": true,
    "status": "pre_order",
    "totalStock": 9
  }
]
```

`400` when `q` is repeated or not a string, `category` is not one of the listed values, or `sort` is not one of the listed values. The response includes the invalid field:

```json
{ "error": "category must be one of jerseys, hoodies, or tees.", "field": "category" }
```

`status` is computed by the server: `sold_out` when every size is at 0, `low_stock` when any size is at or below `lowStockAt`, `pre_order` when `preOrder` is true, otherwise `in_stock`. Sold out takes priority over the others.

### GET /api/products/:id

Response `200`: the full product, including `description` and `sizes`:

```json
{
  "_id": "6650f1…",
  "name": "Primetime Away Jersey",
  "price": 3200,
  "sizes": [
    { "size": "S", "stock": 0 },
    { "size": "M", "stock": 2 },
    { "size": "L", "stock": 5 }
  ],
  "lowStockAt": 3,
  "status": "low_stock"
}
```

`404` when the id is unknown **or** not a valid id format (don't let a bad id cause a 500).

### GET /api/shipping-tiers

Response `200`: active tiers only.

```json
[
  { "region": "Metro Manila", "fee": 0, "freeShippingMin": 0 },
  { "region": "Luzon", "fee": 0, "freeShippingMin": 0 }
]
```

(Fees and the free-shipping line are set by the group in the seed; the numbers above are placeholders.)

### POST /api/orders

Request body:

```json
{
  "customer": {
    "name": "Juan Dela Cruz",
    "mobile": "09171234567",
    "email": "juan@example.com",
    "street": "Unit 4, 123 Katipunan Ave",
    "city": "Quezon City",
    "province": "Metro Manila",
    "region": "Metro Manila"
  },
  "items": [
    { "productId": "6650f1…", "size": "M", "qty": 1 }
  ],
  "paymentMethod": "gcash"
}
```

The server **ignores any price or total sent by the browser**. It looks up each product, takes the price from the database, and computes subtotal, shipping and total with `calculateTotals()`.

| Status | When |
| --- | --- |
| `201` | Saved. Body is the full saved order, including `_id`, `orderNo` and the server's totals. |
| `400` | A field is missing or invalid: empty `items`, `qty` not a whole number from 1 to the per-line maximum, unknown `size` for that product, `region` not an active tier, bad mobile or email format, `paymentMethod` not one of `gcash`, `maya`, `cod`. `field` names the problem. |
| `404` | A `productId` does not exist. |
| `409` | Not enough stock for an item and size. Nothing is saved and no stock changes. `error` names the item and size. |

### GET /api/orders/:id

Response `200`: the saved order as stored. `404` for unknown or malformed ids.

### GET /api/orders

Response `200`: all orders, newest first.

### GET /api/metrics

Response `200`:

```json
{
  "orderCount": 12,
  "totalRevenue": 48250,
  "averageOrderValue": 4020.83,
  "topSellingItem": { "productId": "6650f1…", "name": "Sunday Showdown Home Jersey", "qtySold": 7 },
  "lowStock": [
    { "productId": "6650f2…", "name": "Endzone Pullover Hoodie", "size": "L", "stock": 1 }
  ]
}
```

All five numbers are computed from saved orders and products, never hard-coded. With no orders, counts and revenue are `0` and `topSellingItem` is `null`.
