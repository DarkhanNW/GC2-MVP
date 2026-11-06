# Contributing

Every change reaches `main` through a reviewed Pull Request. Nobody pushes to `main` directly, and nobody commits on another member's behalf.

## The loop

**Issue → branch → commits → Pull Request → teammate reviews → Captain merges**

1. **Pick or open an Issue.** Every PR closes an Issue. Assign it to yourself.
2. **Update main, then branch.**
   ```bash
   git switch main
   git pull
   git switch -c g1/m<member>-<feature>
   ```
   Example: `g1/m3-order-route`
3. **Commit small, say what changed.** `Add stock check to order route`, not `update` or `fix`.
4. **Before asking for review, bring in the latest main** and make sure it still runs:
   ```bash
   git pull --no-edit origin main
   npm start
   ```
5. **Open the PR.** Title: `[G1-M<member>] <what it does>`, for example `[G1-M3] Add order route with stock check`. Fill in the template, including the AI assistance line. Put `Closes #<issue>` in the description.
6. **Review.** The reviewer checks out the branch, runs it, leaves at least one real comment (a question, a bug, a suggestion), then approves.
7. **Merge.** The Captain merges once there is 1 approval. Delete the branch after merging.

## The contract

`docs/routes.md` and `docs/schema.md` are the contract between the front end and the back end. To change either one, open an Issue titled `Contract change: <what>`, agree on it in the Issue, then update the doc and the code in the same PR.

## Rules

- No secrets in the repo: connection strings and keys go in `.env`, which is ignored. Add new variable **names** to `.env.example`.
- No `node_modules/` in commits.
- Every screen that fetches data shows a loading, an empty and an error state.
- The server never trusts the browser: validate every field and recompute totals on the server.
- Use the shared helpers (`public/js/api.js`, `server/services/totals.js`) instead of copying logic.
- If AI helped, you must be able to explain every line you merge, and you add a row to `AI-USAGE.md`.

## Git minimums (per member)

| Requirement | Minimum |
| --- | --- |
| Merged code PRs from your own account | 3 (docs-only PRs don't count) |
| Reviews with at least one real comment | 2 |
| Windows with merged work (Oct 14–28 · Oct 29–Nov 4 · Nov 5–9) | 2 of 3 |
