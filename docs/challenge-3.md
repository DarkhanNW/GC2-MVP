M1: Order Confirmation screen

AI tool used: Claude

1. What the AI gave me

For the Confirmation screen - #60, Claude's code cleared the cart after an order with:

js
localStorage.removeItem('cart');

I accepted it at first because the screen worked fine locally: #60 was opened before #63 added cart-store.js and the real cart key 100yard-cart, so there was nothing for the mismatch to break yet.

2. How I noticed it was wrong

Once I kept working on the code after #63 was merged, I noticed the old cart wasn't removed after I placed an order. removeItem('cart') doesn't throw on a missing key, so there was no error, but the customer would still see their old cart and could reorder the same items.

3. What I did to correct it

I told Claude to use M4's key (100yard-cart) instead, because changing M4's key would mean two changes instead of one. Later, I replaced the string with an import:

js
import { CART_KEY } from './cart-store.js';
// ...
localStorage.removeItem(CART_KEY);

This way, if the key changes in the future, the Confirmation screen adapts automatically without manual changes.

M4: Home, List, and Detail screens

AI tool used: DeepSeek

1. What the AI gave me

For the Home Screen - #61, frontend Playwright test foundations for the Home, List, and Detail screens were served under public/tests/. At first, this was not flagged as an issue, and eventually, #61 was merged with main.

2. How I noticed it was wrong / too complicated

When the List Screen - #62 was reviewed, the Team Captain brought it up as part of their comments (#62 (comment)):

public/tests/e2e/list.spec.js Since Express serves everything in public/ statically, can we move these tests to /tests at the repo root? Also, @playwright/test hasn't been added to devDependencies in package.json in this PR, so you ought to add it with npm install -D @playwright/test and commit package.json and package-lock.json. Is there also a playwright.config.js?

3. What I did to correct it

I did an extensive review of the comments with DeepSeek. We both agreed that the comment has valid and partially valid points:

Tests under public/: Partially valid

It is true that Express serves everything under public/, so public/tests is publicly reachable. Moving tests outside public/ is reasonable. However:

@playwright/test is already declared in public/tests/package.json, not the root package.
public/tests/playwright.config.js already exists.
If tests move to root tests/, the test server root in server.mjs and the config paths must be updated.
Adding Playwright to the backend root package is not strictly necessary if tests keep their own package.
A package lock for the test package is still a reasonable addition.

This is a cleanup/security review point, not a functional List bug.

The fix was implemented. Once #62 was approved, the tests/ folder was moved outside of public/ and onto the repo root. This meant that all Playwright test specs added after #62 was merged are also stored in tests/ at the repo root. The move was also retroactive: since #61 was merged before #62, all of the Playwright test foundations as well as the Home and List screen test specs were moved to the repo root.

M6: Owner dashboard — GET /api/metrics low-stock query

AI tool used: Claude

1. What the AI gave me

For the low-stock query in GET /api/metrics, Claude suggested:

js
{ $match: { $expr: { $lte: ['$sizes.stock', { $ifNull: ['$lowStockAt', 3] }] } } },

I accepted it because it looked safe, and the route worked.

2. How I noticed it was wrong / too complicated

A reviewer commented on my PR (#84) that the Product model already gives lowStockAt a default of 3, so the $ifNull fallback is redundant. It was also a second hard-coded copy of the "low stock at 3" rule.

3. What I did to correct it

Despite the AI's suggestion, I changed it to:

js
{ $match: { $expr: { $lte: ['$sizes.stock', '$lowStockAt'] } } },

The comment explaining this section notes that sizes at 0 are kept on purpose, so the owner can see what to order.