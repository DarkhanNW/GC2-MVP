const mongoose = require('mongoose');

const shippingTierSchema = new mongoose.Schema(
  {
    region: {
      type: String,
      enum: ['Metro Manila', 'Luzon', 'Visayas', 'Mindanao'],
      required: true,
      unique: true,
    },
    fee: { type: Number, min: 0, validate: Number.isInteger, required: true },
    freeShippingMin: {
      type: Number,
      min: 0,
      validate: Number.isInteger,
      required: true,
    },
    active: { type: Boolean, default: true },
  },
  { collection: 'shippingTiers' }
);

module.exports =
  mongoose.models.ShippingTier ||
  mongoose.model('ShippingTier', shippingTierSchema);
