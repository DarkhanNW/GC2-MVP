# GC2 Feedback Response

Response to instructor feedback on `gc2-v1.0` (graded Nov 24). One row per comment.

## Instructor comments

| # | Feedback | What we changed | Where | Proof |
|---|----------|-----------------|-------|-------|
| 1 | Server works out the price from the database instead of trusting the browser, and correctly refuses a second buyer going for the last item | No change needed. Kept as is; shown live in the demo. | `server/services/totals.js`, `server/routes/orders.js` | _TODO_ |
| 2 | Challenge 1 skipped testing `POST /api/orders`, but a bad order is never saved; send the six requests from the brief and screenshot each result | _TODO_ | `docs/refusals.md`; PR #___ | _TODO_ |
| 3 | Section 4.4 does the arithmetic but never reaches a decision; put in the real margin | _TODO_ | `docs/business.md` 4.4; PR #___ | _TODO_ |
| 4 | Still doesn't answer why a customer would come to us instead of Shopee; build the special-sourcing request for Dec 2 | _TODO_ | sourcing routes/screens; PR #___ | _TODO_ |
| 5 | Site takes 22 s on first visit because the free Render tier sleeps after ~15 min; set up an uptime monitor on `/api/health` every 10 min and open the site early | Added an UptimeRobot monitor that requests `GET /api/health` every 10 minutes so the server never sleeps. We will also open the site a few minutes before presenting. | README "Uptime monitor" section; PR #133 (closes #105) | First load after monitor: ___ ms, measured with DevTools, cache disabled ([screenshot](img/cold-start-fixed.png)) |
| 6 | Every product shows the same grey placeholder; put real photos on at least the featured items | _TODO_ | `server/seed.js`, `public/img/`; PR #___ | _TODO_ |
| 7 | Challenge 4 only follows the free-shipping rule to the seed script; list every enforcement point (tier record, totals function, checkout preview, below-threshold hint), move it to `challenges.md`, and write up the double-click stretch | _TODO_ | `docs/challenges.md`; PR #___ | _TODO_ |
| 8a | `business.md` opens with "Draft for CP0", calls settled numbers undecided, and has three rules with a dash instead of a reason | _TODO_ | `docs/business.md`; PR #___ | _TODO_ |
| 8b | `AI-USAGE.md` has two duplicated rows and two cut off mid-sentence | Fixed table formatting. Removed M1's duplicate row (#27) and completed M1's cut-off row (`?v=` removal). Still to do: M2's duplicate row (#24) and M3's cut-off row (#28), each fixed by its owner. | `AI-USAGE.md`; PR #132 | _TODO_ |

## Points from the final brief (§5) that apply to every group

| # | Point | What we did | Where |
|---|-------|-------------|-------|
| A | Survive a cold start | See row 5. | README; PR #133 |
| B | Finish the "so": every money rule ends in a decision with a number | _TODO_ | `docs/business.md`; PR #___ |
| C | Claim what the code already does (double-click lock, parallel fetch, guarded last unit) | _TODO_ | `docs/challenges.md`; PR #___ |