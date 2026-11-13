# Baseline

Date: November 9, 2026

Time: 9:00 AM

Performed on a local server on `localhost:3000`

## Lighthouse mobile

`localhost:3000/list.html`

Chrome DevTools → Lighthouse → Mobile.

| Category | Score |
|---|---:|
| Performance | 75 |
| Accessibility | 98 |
| Best Practices | 100 |

## First-load requests and transfer size

`localhost:3000/list.html`

Chrome DevTools → Network → Disable cache → reload `localhost:3000/list.html`.

| Measure | Result |
|---|---:|
| Total requests | 17 |
| Total transfer size | 43.2 kB |

## List route response time

`localhost:3000/list.html`

`GET /api/products`, measured from the Network tab or Postman.

| Run | Response time |
|---|---:|
| 1 | 48 ms |
| 2 | 62 ms |
| 3 | 54 ms |
| Median | 54 ms |

## Three known weaknesses

1. Requests are blocking the page's initial render, which may delay the Largest Contentful Paint. Deferring or inlining can move these network requests out of the critical path.
2. Layout shifts are occurring. They happen when elements move absent any user interaction. The causes of layout shifts, such as elements being added, removed, or their fonts changing as the page loads must be investigated thoroughly.
3. Critical requests are chained extensively. They can be avoided by reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load.

No target scores. This is the honest starting point for later comparison.
