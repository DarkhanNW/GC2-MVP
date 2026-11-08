# Challenge 1 — deployed API checks

Issue #45 asks for six requests against the deployed API, with screenshots. These checks cover successful reads and expected input errors from the API contract. They are read-only and do not create orders or change stock.

Set the Postman `baseUrl` to the deployed site before running the requests. Capture each request and its response in a screenshot, then save them under `docs/challenge-1/screenshots/` using the filenames below.

| # | Request | Expected result | Screenshot |
| --- | --- | --- | --- |
| 1 | `GET {{baseUrl}}/api/health` | `200` with server and database status | `01-health.png` |
| 2 | `GET {{baseUrl}}/api/products` | `200` with a JSON array; an empty catalog is still `200` | `02-products.png` |
| 3 | `GET {{baseUrl}}/api/products?category=jerseys&sort=price_asc` | `200` with a JSON array sorted by ascending price | `03-filter-sort.png` |
| 4 | `GET {{baseUrl}}/api/products?category=not-a-category` | `400` with `error` and `field: "category"` | `04-invalid-category.png` |
| 5 | `GET {{baseUrl}}/api/products/not-a-valid-id` | `404`, not `500` | `05-invalid-product-id.png` |
| 6 | `GET {{baseUrl}}/api/shipping-tiers` | `200` with active shipping tiers | `06-shipping-tiers.png` |

Do not run `POST /api/orders` as part of this set: it persists an order and reduces inventory. These six read-only checks do not require a state-changing request.

## Evidence status

Screenshots and deployed responses are pending. The deployed health endpoint, homepage, and product-list endpoint timed out during initial checks. Rerun the six requests after the deployed service is responding, then save the request and response screenshots at the paths above.
