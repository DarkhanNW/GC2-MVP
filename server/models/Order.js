
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: {
      type: String,
      required: true,
      match: /^09\d{9}$/,
    },
    email: { type: String, required: true, trim: true, lowercase: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    region: {
      type: String,
      enum: ['Metro Manila', 'Luzon', 'Visayas', 'Mindanao'],
      required: true,
    },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    size: {
      type: String,
      enum: ['S', 'M', 'L', 'XL', 'XXL'],
      required: true,
    },
    qty: {
      type: Number,
      min: 1,
      max: 3,
      validate: Number.isInteger,
      required: true,
    },
    unitPrice: { type: Number, min: 1, required: true },
    lineTotal: { type: Number, min: 1, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: customerSchema,
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: items => items.length > 0,
        message: 'An order must contain at least one item.',
      },
    },
    subtotal: { type: Number, min: 0, required: true },
    shippingFee: { type: Number, min: 0, required: true },
    total: { type: Number, min: 0, required: true },
    paymentMethod: {
      type: String,
      enum: ['gcash', 'maya', 'cod'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true, collection: 'orders' }
);

module.exports =
  mongoose.models.Order || mongoose.model('Order', orderSchema);
