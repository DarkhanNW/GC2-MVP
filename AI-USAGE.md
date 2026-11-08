# AI usage log

One row per meaningful use of an AI assistant. Newest at the bottom.

| Date | Member | Tool | What we asked for | What we kept or changed | How we checked it |
| --- | --- | --- | --- | --- | --- |
| Nov 4–5 | M1 | Claude | Work plan splitting GC2 into six lanes; CP0 repo skeleton (README, CONTRIBUTING, PR template, server skeleton, route table, schema, Issues script, first draft of business.md traceability and rules) | Added .gitattributes for compatibility | We ran the server locally to verify the skeleton worked and agreed on business decisions. |

| Nov 6 | M1 | Claude | #22 Render deploy | Step-by-step help deploying the Express + Atlas skeleton to Render: Connecting the repo, Render service settings, how to verify the live deploy | No code generated. Did the checks and all Render/Atlas setup myself. Allowed 0.0.0.0/0 in Atlas (DB still needs credentials). Chose the service name and region (Singapore). Edited and reviewed the AI-drafted log/PR wording to match what I actually did. | Live `/api/health` shows DB connected; unknown `/api/` route returns JSON 404 (status checked in DevTools Network tab); `/` serves `public/`; Was able to open the site on my phone. |

| Nov 6 | M1 | Claude | #23 api() fetch helper | Step-by-step guidance on fetch, headers, spread, await, try/catch and ?. / ??. Creating test cases to use in the console. All code was written by me. | Changed index.html in public/ | Checked with Console and Network tests (200, 404, POST payload, error message when server's down)

| Nov 7 | M1 | Claude | #27 GET /api/shipping-tiers | Step-by-step guidance on writing a Mongoose model, creating a route file, how to mount using app.use(), creating a semi-automated test on Postman. All code was written by me, and reviewed by the AI. | Kept the structure. Changed sort() order to alphabetical to avoid a schema change.  | Checked in the browser through /api/shipping-tiers, and via Postman, temporarily changed 'active' key for Mindanao region to test filter in find().

| Nov 6-8 | M4 | DeepSeek | #35 Render products with search, category filtering, and sorting. Show status badges, Handle loading, empty, and error states, support phone width. | Kept the shared cards, chrome, API client, status badges, and state components from Home screen PR. Added list.html, the list controller, and the list URL-state helper. | 7 Playwright tests: product loading/count/status badges, search, category filter, price sort, loading skeleton, empty state, error state, and 390 × 844 phone layout without overflow. The test suite runs against a stubbed API.