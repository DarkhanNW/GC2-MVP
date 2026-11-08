const express = require('express');
const Product = require('../models/Product');
const productCategories = require('../productCategories');

const router = express.Router();

const sortOptions = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1, _id: -1 },
};

function getStatus(product) {
  if (product.sizes.every(size => size.stock === 0)) return 'sold_out';
  if (product.sizes.some(size => size.stock <= (product.lowStockAt ?? 3))) {
    return 'low_stock';
  }
  if (product.preOrder) return 'pre_order';
  return 'in_stock';
}

router.get('/', async (req, res, next) => {
  const filter = {};
  const { q, category, sort } = req.query;

  if (q !== undefined && typeof q !== 'string') {
    return res.status(400).json({
      error: 'q must be a single search string.',
      field: 'q',
    });
  }

  if (
    category !== undefined &&
    (typeof category !== 'string' || !productCategories.includes(category))
  ) {
    return res.status(400).json({
      error: 'category must be one of jerseys, hoodies, or tees.',
      field: 'category',
    });
  }

  if (
    sort !== undefined &&
    (typeof sort !== 'string' || !Object.hasOwn(sortOptions, sort))
  ) {
    return res.status(400).json({
      error: 'sort must be price_asc, price_desc, or newest.',
      field: 'sort',
    });
  }

  if (typeof q === 'string' && q.trim()) {
    const search = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchPattern = new RegExp(search, 'i');
    filter.$or = [
      { name: searchPattern },
      { team: searchPattern },
      { description: searchPattern },
    ];
  }

  if (category !== undefined) {
    filter.category = category;
  }

  const sortBy = sort === undefined ? sortOptions.newest : sortOptions[sort];

  try {
    const products = await Product.find(filter).sort(sortBy).lean();
    res.json(
      products.map(product => ({
        _id: product._id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        team: product.team,
        price: product.price,
        image: product.image,
        featured: product.featured,
        preOrder: product.preOrder,
        status: getStatus(product),
        totalStock: product.sizes.reduce((total, size) => total + size.stock, 0),
      }))
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
