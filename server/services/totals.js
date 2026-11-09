const ShippingTier = require('../models/ShippingTier');

async function calculateTotals(items, region) {
    const pricedItems = items.map(item => ({ ...item, lineTotal: item.qty * item.unitPrice }));
    const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const tier = await ShippingTier.findOne({ region, active: true }).lean();
    if (!tier) {
        const err = new Error('Unknown region');
        err.status = 400; 
        err.field = 'region';
        throw err;
    }
    const isFree = (tier.freeShippingMin > 0) && (subtotal >= tier.freeShippingMin);
    const shippingFee = isFree ? 0 : tier.fee;
    return { subtotal, shippingFee, total: subtotal + shippingFee, items: pricedItems };
}

module.exports = { calculateTotals };