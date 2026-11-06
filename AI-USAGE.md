# AI usage log

One row per meaningful use of an AI assistant. Newest at the bottom.

| Date | Member | Tool | What we asked for | What we kept or changed | How we checked it |
| --- | --- | --- | --- | --- | --- |
| Nov 4–5 | M1 | Claude | Work plan splitting GC2 into six lanes; CP0 repo skeleton (README, CONTRIBUTING, PR template, server skeleton, route table, schema, Issues script, first draft of business.md traceability and rules) | Added .gitattributes for compatibility | We ran the server locally to verify the skeleton worked and agreed on business decisions. |

| Nov 6 | M1 | Claude | #22 Render deploy | Step-by-step help deploying the Express + Atlas skeleton to Render: Connecting the repo, Render service settings, how to verify the live deploy | No code generated. Did the checks and all Render/Atlas setup myself. Allowed 0.0.0.0/0 in Atlas (DB still needs credentials). Chose the service name and region (Singapore). Edited and reviewed the AI-drafted log/PR wording to match what I actually did. | Live `/api/health` shows DB connected; unknown `/api/` route returns JSON 404 (status checked in DevTools Network tab); `/` serves `public/`; Was able to open the site on my phone. |
