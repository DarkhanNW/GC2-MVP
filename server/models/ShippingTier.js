const mongoose = require('mongoose');
const shippingSchema = new mongoose.Schema({
    region: { type: String, required: true, unique: true, enum: ['Metro Manila', 'Luzon', 'Visayas', 'Mindanao'], trim: true},
    fee: { type: Number, required: true, min: 0 },
    freeShippingMin: { type: Number, default: 0, min: 0 },
    active: { type: Boolean , default: true },
})

module.exports = mongoose.model('ShippingTier', shippingSchema, 'shippingTiers');