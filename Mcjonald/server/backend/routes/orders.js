
import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/orders.js';
import Menu from '../models/menu.js';
import User from '../models/users.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const staff = authorize('Admin', 'Employee');

// GET ORDERS
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'Customer'
      ? { customer: req.user._id }
      : {};

    const orders = await Order.find(filter)
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch {
    res.status(500).json({ message: 'Unable to load orders.' });
  }
});

// CREATE ORDER - CUSTOMER ONLY
router.post('/', protect, authorize('Customer'), async (req, res) => {
  try {
    const { items, note = '' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Your cart is empty.'
      });
    }

    let total = 0;
    const orderItems = [];

    for (const line of items) {
      if (!mongoose.isValidObjectId(line.menuId)) {
        return res.status(400).json({ message: 'Invalid menu item.' });
      }

      const menuItem = await Menu.findById(line.menuId);

      if (!menuItem || !menuItem.available) {
        return res.status(400).json({
          message: 'A selected item is unavailable.'
        });
      }

      const qty = Number(line.qty);

      if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
        return res.status(400).json({ message: 'Invalid quantity.' });
      }

      const price = menuItem.price;
      total += price * qty;

      orderItems.push({
        menuId: menuItem._id,
        name: menuItem.name,
        price,
        qty
      });
    }

    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      note,
      total,
      status: 'Pending'
    });

    res.status(201).json(order);
  } catch {
    res.status(400).json({ message: 'Unable to place order.' });
  }
});

// UPDATE ORDER STATUS - STAFF ONLY
router.patch('/:id/status', protect, staff, async (req, res) => {
  try {
    const allowed = ['Pending', 'Preparing', 'Served', 'Cancelled'];

    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({
        message: 'Invalid order status.'
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json(order);
  } catch {
    res.status(400).json({ message: 'Unable to update order.' });
  }
});

// DELETE ORDER - ADMIN ONLY
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json({ message: 'Order deleted.' });
  } catch {
    res.status(400).json({ message: 'Unable to delete order.' });
  }
});

export default router;
