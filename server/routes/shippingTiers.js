const router = require('express').Router();
const Tier = require('../models/ShippingTier');

router.get('/', async (req, res, next) => {
    try {
        const tiers = await Tier.find({ active: true }, 'region fee freeShippingMin -_id').sort({ region: 1 }).lean();
        res.status(200).json(tiers);
    } catch (err) { next(err); }
});

module.exports = router;