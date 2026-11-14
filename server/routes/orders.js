
const express = require('express');
const mongoose = require('mongoose');

const Product = require('../models/Product');
const Order = require('../models/Order');
const { calculateTotals } = require('../services/totals');

const router = express.Router();

function createError(message, status, field) {
  const error = new Error(message);
  error.status = status;
  if (field) error.field = field;
  return error;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

router.get('/:id', async (req, res, next) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(404).json({
      error: 'Order not found.',
    });
  }

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found.',
      });
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  let session;

  try {
    const { customer, items, paymentMethod } = req.body || {};

    // Validate customer information.
    const customerFields = [
      'name',
      'mobile',
      'email',
      'street',
      'city',
      'province',
      'region',
    ];

    if (!customer || typeof customer !== 'object' || Array.isArray(customer)) {
      throw createError('Customer information is required.', 400, 'customer');
    }

    for (const field of customerFields) {
      if (!isNonEmptyString(customer[field])) {
        throw createError(
          `${field} is required.`,
          400,
          `customer.${field}`
        );
      }
    }

    if (!/^09\d{9}$/.test(customer.mobile.trim())) {
      throw createError(
        'Mobile number must be an 11-digit Philippine number starting with 09.',
        400,
        'customer.mobile'
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      throw createError('Please provide a valid email address.', 400, 'customer.email');
    }

    // Validate order items.
    if (!Array.isArray(items) || items.length === 0) {
      throw createError('At least one order item is required.', 400, 'items');
    }

    if (!['gcash', 'maya', 'cod'].includes(paymentMethod)) {
      throw createError(
        'Payment method must be gcash, maya, or cod.',
        400,
        'paymentMethod'
      );
    }

    const seenLines = new Set();

    for (const item of items) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw createError('Each item must be an object.', 400, 'items');
      }

      if (!mongoose.isObjectIdOrHexString(item.productId)) {
        throw createError('Product not found.', 404, 'items.productId');
      }

      if (
        !Number.isInteger(item.qty) ||
        item.qty < 1 ||
        item.qty > 3
      ) {
        throw createError(
          'Quantity must be a whole number from 1 to 3.',
          400,
          'items.qty'
        );
      }

      if (!isNonEmptyString(item.size)) {
        throw createError('A size is required.', 400, 'items.size');
      }

      const lineKey = `${item.productId}:${item.size}`;

      if (seenLines.has(lineKey)) {
        throw createError(
          'Duplicate product and size lines are not allowed.',
          400,
          'items'
        );
      }

      seenLines.add(lineKey);
    }

    // Start a transaction for stock updates and order creation.
    session = await mongoose.startSession();

    let savedOrder;

    await session.withTransaction(async () => {
      const productCache = new Map();
      const orderItems = [];

      for (const item of items) {
        const productId = item.productId.toString();

        let product = productCache.get(productId);

        if (!product) {
          product = await Product.findById(productId).session(session);

          if (!product) {
            throw createError('Product not found.', 404, 'items.productId');
          }

          productCache.set(productId, product);
        }

        const selectedSize = product.sizes.find(
          entry => entry.size === item.size
        );

        if (!selectedSize) {
          throw createError(
            `Size ${item.size} is not available for ${product.name}.`,
            400,
            'items.size'
          );
        }

        // Decrement stock only if enough stock remains.
        const stockUpdate = await Product.updateOne(
          {
            _id: product._id,
            sizes: {
              $elemMatch: {
                size: item.size,
                stock: { $gte: item.qty },
              },
            },
          },
          {
            $inc: { 'sizes.$.stock': -item.qty },
          },
          { session }
        );

        if (stockUpdate.matchedCount === 0) {
          throw createError(
            `Insufficient stock for ${product.name}, size ${item.size}.`,
            409,
            'items'
          );
        }

        orderItems.push({
          productId: product._id,
          name: product.name,
          size: item.size,
          qty: item.qty,
          unitPrice: product.price,
          lineTotal: product.price * item.qty,
        });
      }

      const totals = await calculateTotals(
        orderItems,
        customer.region.trim()
      );

      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderId = new mongoose.Types.ObjectId();
      const orderNo = `100Y-${date}-${orderId.toString().toUpperCase()}`;

      const orderData = {
         _id: orderId,
        orderNo,
        customer: {
          name: customer.name.trim(),
          mobile: customer.mobile.trim(),
          email: customer.email.trim().toLowerCase(),
          street: customer.street.trim(),
          city: customer.city.trim(),
          province: customer.province.trim(),
          region: customer.region.trim(),
        },
        items: orderItems,
        ...totals,
        paymentMethod,
      };

      const created = await Order.create([orderData], { session });
      savedOrder = created[0];
    });

    res.status(201).json(savedOrder);
  } catch (error) {
    next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

module.exports = router;
