# 100-Yard Apparel — "Built for the Bowl"

An online store that sources NFL jerseys, hoodies and game-day tops from overseas sellers and sells them locally to Filipino fans, so they don't have to import them themselves. This repo is our GC2 build: a visitor can browse the catalog, pick a size and quantity, check out with a simulated payment, and get an order saved in our database.

- **Deployed site:** _add the Render URL here_
- **GC1 proposal:** Group 1, "100 Yard-Apparel"

## Roster and ownership

| Member | GitHub | Lane | Owns |
| --- | --- | --- | --- |
| M1 Kevin Michael Lee (Captain) | @DarkhanNW | Captain / DevOps | Repo, server skeleton, deploy, merging, submission |
| M2 Bryan Kier Leopando | @bryan-kier | Catalog API | `GET /api/products`, `GET /api/products/:id`, seed script, search/filter/sort |
| M3 Rynne Barrios | @rynnoceros-12 | Orders API | `POST /api/orders`, `GET /api/orders/:id`, `GET /api/shipping-tiers`, `calculateTotals`, stock transaction |
| M4 Justin Ivan Lim | @justinivanlim | Browse UI | Home, List, Detail screens |
| M5 Ali Custodio | @alicstodio | Checkout UI | Cart, Checkout, Confirmation screens |
| M6 Martin Jed Tan | @martintanaswork-glitch | Owner dashboard | Owner screen, `GET /api/orders`, `GET /api/metrics` |

## Tech stack

| Layer | Tool (version) | Why we chose it |
| --- | --- | --- |
| Runtime | Node.js 20 LTS or newer | Same language on the server and in the browser; matches the class demos. |
| Server | Express 4 | Small and well documented; the routing style the class uses. Our GC1 plan was MERN, so Express was already part of it. |
| Database | MongoDB Atlas (free M0 cluster) + Mongoose 8 | GC1 chose MongoDB because product variants (team, size, stock) fit naturally as documents. Atlas runs as a replica set, so we can use transactions to reduce stock in the same operation that saves the order. |
| Front end | Plain HTML, CSS and JavaScript with `fetch` | GC1 planned React; the Final Project requires it. We start in plain JavaScript so GC2 gives a clear baseline and the React upgrade is a step, not a rewrite. |
| Hosting | Render (one web service) | Express serves both the API and the `public/` folder from one URL, so there are no cross-origin issues. Free tier is enough for class. |
| API testing | Postman | Required by the brief; the exported collection lives in `docs/`. |

## Run it locally

1. Install Node.js 20 or newer.
2. Clone the repo and install packages:
   ```bash
   git clone <repo-url>
   cd 100-yard-apparel
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the values (ask the Captain for the Atlas connection string; never commit it).
4. Load the sample data: `npm run seed` (rebuilds products and shipping tiers from `server/seed.js`)
5. Start the server: `npm run dev` (restarts on save) or `npm start`
6. Open http://localhost:3000. Check the server is up at http://localhost:3000/api/health.

## Environment variables

| Name | What it is |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string, including the database name |
| `PORT` | Port the server listens on (Render sets this for you; locally 3000) |

## Project layout

```
server/
  index.js          Express app: JSON, static files, routes, error handler
  db.js             Mongo connection
  models/           Mongoose schemas (products, orders, shippingTiers)
  routes/           One file per resource
  services/         Shared business logic (calculateTotals lives here)
  seed.js           Rebuilds the sample data
public/             The front end: one HTML file per screen, js/, css/
docs/               Route table, schema, business case, challenges, baseline, Postman export
```

## Changes since GC1

| GC1 plan | GC2 build | Why |
| --- | --- | --- |
| React front end | Plain HTML/CSS/JS | React is required in the Final Project; GC2 is the baseline we improve on. |
| Accounts with email/password, JWT, admin roles | No login; owner screen is open | Login is out of GC2 scope (brief 2.8). Moved to the Final Project. |
| GCash or PayPal sandbox payment | Simulated payment choice (GCash, Maya, COD) | Real payments are out of GC2 scope. |
| EasyParcel shipping quotes | Our own shipping tiers by region, stored in the database | Third-party APIs are out of GC2 scope; tiers keep "transparent shipping costs" from GC1. |
| Email confirmation (Resend/Twilio), restock alerts, order tracking | Not built yet | Final Project. |
| Pre-order system | Pre-order items are labelled but sold like stocked items | A full pre-order flow is Final Project work. |

## How we work

See [CONTRIBUTING.md](CONTRIBUTING.md). AI use is logged in [AI-USAGE.md](AI-USAGE.md).
