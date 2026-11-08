# AI usage log

One row per meaningful use of an AI assistant. Newest at the bottom.

| Date | Member | Tool | What we asked for | What we kept or changed | How we checked it |
| --- | --- | --- | --- | --- | --- |
| Nov 4–5 | M1 | Claude | Work plan splitting GC2 into six lanes; CP0 repo skeleton (README, CONTRIBUTING, PR template, server skeleton, route table, schema, Issues script, first draft of business.md traceability and rules) | Added .gitattributes for compatibility | We ran the server locally to verify the skeleton worked and agreed on business decisions. |

| Nov 6 | M1 | Claude | #22 Render deploy | Step-by-step help deploying the Express + Atlas skeleton to Render: Connecting the repo, Render service settings, how to verify the live deploy | No code generated. Did the checks and all Render/Atlas setup myself. Allowed 0.0.0.0/0 in Atlas (DB still needs credentials). Chose the service name and region (Singapore). Edited and reviewed the AI-drafted log/PR wording to match what I actually did. | Live `/api/health` shows DB connected; unknown `/api/` route returns JSON 404 (status checked in DevTools Network tab); `/` serves `public/`; Was able to open the site on my phone. |

| Nov 6 | M1 | Claude | #23 api() fetch helper | Step-by-step guidance on fetch, headers, spread, await, try/catch and ?. / ??. Creating test cases to use in the console. All code was written by me. | Changed index.html in public/ | Checked with Console and Network tests (200, 404, POST payload, error message when server's down)

<<<<<<< HEAD
| Nov 7 | M1 | Claude | #27 GET /api/shipping-tiers | Step-by-step guidance on writing a Mongoose model, creating a route file, how to mount using app.use(), creating a semi-automated test on Postman. All code was written by me, and reviewed by the AI. | Kept the structure. Changed sort() order to alphabetical to avoid a schema change.  | Checked in the browser through /api/shipping-tiers, and via Postman, temporarily changed 'active' key for Mindanao region to test filter in find().
| Nov 8 | M6 | ChatGPT | Asked for help reviewing my code and how to test it. I wrote the code. | Kept my code and made changes based on feedback. | Made revisions on how to test my code. |
=======
| Nov 8 | M2 | Copilot | Implement the catalog seed script for Issue #24 | Added product and shipping-tier models, 10 sample products and four shipping tiers; adjusted stock to demonstrate different product statuses | Ran `npm run seed` twice against an isolated Atlas database; queried the saved data and checked categories, stock examples, pre-order, and shipping fees |

| Nov 8 | M2 | Copilot | Implement `GET /api/products` for Issue #25 | Added catalog search, category filtering, sorting, computed status and stock fields, and query validation | Checked the endpoint over HTTP against the isolated database, including combined filters, empty results, and invalid query values |

| Nov 8 | M2 | Copilot | Implement the catalog seed script for Issue #24 | Added product and shipping-tier models, 10 sample products and four shipping tiers; adjusted stock to demonstrate different product statuses | Ran `npm run seed` twice against an isolated Atlas database; queried the saved data and checked categories, stock examples, pre-order, and shipping fees |

| Nov 7 | M1 | Claude | #27 GET /api/shipping-tiers | Step-by-step guidance on writing a Mongoose model, creating a route file, how to mount using app.use(), creating a semi-automated test on Postman. All code was written by me, and reviewed by the AI. | Kept the structure. Changed sort() order to alphabetical to avoid a schema change.  | Checked in the browser through /api/shipping-tiers, and via Postman, temporarily changed 'active' key for Mindanao region to test filter in find().
>>>>>>> origin/g1/m6-orders-list
