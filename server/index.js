require('dotenv').config();
const path = require('path');
const express = require('express');
const { connectDB, mongoose } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const shippingTierRoutes = require('./routes/shippingTiers');

app.use(express.json());

// Health check: confirms the server is up and whether the database is connected.
app.get('/api/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.status(200).json({
    status: 'ok',
    db: dbStates[mongoose.connection.readyState] || 'unknown',
  });
});

app.use('/api/products', require('./routes/products'));

// Feature routes are mounted here as each lane merges them, for example:
// app.use('/api/orders', require('./routes/orders'));           // M3 (POST, GET /:id), M6 (GET /)

// app.use('/api/shipping-tiers', require('./routes/shippingTiers')); // M1
app.use('/api/shipping-tiers', shippingTierRoutes);

// app.use('/api/metrics', require('./routes/metrics'));         // M6

// Any /api path that no route handled is a JSON 404, never an HTML page.
app.use('/api', (req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// The front end: every screen is a file in public/.
app.use(express.static(path.join(__dirname, '..', 'public')));


// Error handler: every error leaves as { error, field? } with a sensible status.
// Throw or pass an error with .status (and optionally .field) from any route.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  const body = { error: status >= 500 ? 'Something went wrong on our side.' : err.message };
  if (err.field) body.field = err.field;
  res.status(status).json(body);
});

async function start() {
  try {
    await connectDB(process.env.MONGODB_URI);
  } catch (err) {
    console.error(`Database connection failed: ${err.message}`);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`100-Yard Apparel running at http://localhost:${PORT}`);
  });
}

start();
