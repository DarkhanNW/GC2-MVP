# Frontend PR tests

These tests use Playwright and a disposable API fixture. They do not require the
backend to be running.

## Setup

```bash
cd tests
npm install
npx playwright install chromium
```

## Commands

From the `tests/` directory:

```bash
npm run test:home     # #34 PR
npm run test:list     # #35 PR, after #34 PR is merged
npm run test:detail   # #36 PR, after #34 PR and #35 PR are merged
npm test              # all specs present in the current stack
```

The static server serves the frontend from `public/` in the repository root. Playwright intercepts `/api/products` and `/api/products/:id`, so the
tests can exercise normal, loading, empty, error, 404, low-stock, sold-out, and
pre-order states without a backend.

## Notes

- This test harness is part of #34 PR; #35 PR and #36 PR add one spec each.
- The fixture is intentionally test-only. It is never served as `/api/products`.
- Phone checks use a real 390 × 844 Playwright viewport.
- The normal-flow specs also fail on page errors or console errors.
