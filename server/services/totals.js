const ShippingTier = require('../models/ShippingTier');

async function calculateTotals(items, region) {
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const tier = await ShippingTier.findOne({ region, active: true }).lean();
    if (!tier) {
        const err = new Error('Please select a valid shipping region.');
        err.status = 400;
        err.field = 'customer.region';
        throw err;
    }
    const isFree = (tier.freeShippingMin > 0) && (subtotal >= tier.freeShippingMin);
    const shippingFee = isFree ? 0 : tier.fee;
    return { subtotal, shippingFee, total: subtotal + shippingFee };
}

module.exports = { calculateTotals };