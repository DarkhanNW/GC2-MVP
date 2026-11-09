# Baseline

## Lighthouse mobile

Chrome DevTools → Lighthouse → Mobile.

| Category | Score |
|---|---:|
| Performance | [95] |
| Accessibility | [95] |
| Best Practices | [100] |

## First-load requests and transfer size

Chrome DevTools → Network → Disable cache → reload `/list.html`.

| Measure | Result |
|---|---:|
| Total requests | [17] |
| Total transfer size | [43.2] kB |

## List route response time

`GET /api/products`, measured from the Network tab or Postman.

| Run | Response time |
|---|---:|
| 1 | [48] ms |
| 2 | [62] ms |
| 3 | [54] ms |
| Median | [54] ms |

## Three known weaknesses

1. [Weakness in your own words.]
2. [Weakness in your own words.]
3. [Weakness in your own words.]

No target scores. This is the honest starting point for later comparison.
