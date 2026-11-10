
const ShippingTier = require('../models/ShippingTier');

async function calculateTotals(items, region) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0
  );

  const shippingTier = await ShippingTier.findOne({
    region,
    active: true,
  }).lean();

  if (!shippingTier) {
    const error = new Error('Please select a valid shipping region.');
    error.status = 400;
    error.field = 'customer.region';
    throw error;
  }

  const shippingFee =
    subtotal >= shippingTier.freeShippingMin ? 0 : shippingTier.fee;

  return {
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
  };
}

module.exports = { calculateTotals };
