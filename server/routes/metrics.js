const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

// GET /api/metrics: the five owner numbers, computed from saved data (M6)
router.get('/', async (req, res, next) => {
  try {
    const [totals, top, lowStock] = await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: null,
            orderCount: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' },
          },
        },
      ]),
      Order.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            qtySold: { $sum: '$items.qty' },
          },
        },
        { $sort: { qtySold: -1, name: 1 } },
        { $limit: 1 },
      ]),
      Product.aggregate([
        { $unwind: '$sizes' },
        // Includes sizes at 0 on purpose: to check stock for reordering. 
        { $match: { $expr: { $lte: ['$sizes.stock', '$lowStockAt'] } } },        
        {
          $project: {
            _id: 0,
            productId: '$_id',
            name: 1,
            size: '$sizes.size',
            stock: '$sizes.stock',
          },
        },
        { $sort: { stock: 1, name: 1 } },
      ]),
    ]);

    const t = totals[0];
    res.status(200).json({
      orderCount: t ? t.orderCount : 0,
      totalRevenue: t ? t.totalRevenue : 0,
      averageOrderValue: t ? Math.round(t.averageOrderValue * 100) / 100 : 0,
      topSellingItem: top[0]
        ? { productId: top[0]._id, name: top[0].name, qtySold: top[0].qtySold }
        : null,
      lowStock: lowStock,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

