const mongoose = require('mongoose');
const productCategories = require('../productCategories');

const sizeSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      enum: ['S', 'M', 'L', 'XL', 'XXL'],
      required: true,
    },
    stock: {
      type: Number,
      min: 0,
      validate: Number.isInteger,
      required: true,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    category: {
      type: String,
      enum: productCategories,
      required: true,
    },
    team: { type: String, required: true },
    price: {
      type: Number,
      min: 1,
      validate: Number.isInteger,
      required: true,
    },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    preOrder: { type: Boolean, default: false },
    sizes: { type: [sizeSchema], required: true, validate: v => v.length > 0 },
    lowStockAt: { type: Number, min: 0, default: 3 },
  },
  { timestamps: true, collection: 'products' }
);

module.exports =
  mongoose.models.Product || mongoose.model('Product', productSchema);
