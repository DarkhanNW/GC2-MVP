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
npm run test:home     # PR 1
npm run test:list     # PR 2, after PR 1 is merged
npm run test:detail   # PR 3, after PR 1 and PR 2 are merged
npm test              # all specs present in the current stack
```

The static server serves the frontend from the repository root (the parent of
`tests/`). Playwright intercepts `/api/products` and `/api/products/:id`, so the
tests can exercise normal, loading, empty, error, 404, low-stock, sold-out, and
pre-order states without a backend.

## Notes

- This test harness is part of PR 1; PR 2 and PR 3 add one spec each.
- The fixture is intentionally test-only. It is never served as `/api/products`.
- Phone checks use a real 390 × 844 Playwright viewport.
- The normal-flow specs also fail on page errors or console errors.
