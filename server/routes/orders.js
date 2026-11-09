const router = require('express').Router();
const Order = require('../models/Order');

router.get('/', async (req, res, next) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).lean();
        res.status(200).json(orders);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
