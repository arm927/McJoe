
import express from 'express';
import Menu from '../models/menu.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET ALL MENU ITEMS
router.get('/', async (req, res) => {
  try {
    const items = await Menu.find().sort({ createdAt: -1 });
    res.json(items);
  } catch {
    res.status(500).json({ message: 'Unable to load menu.' });
  }
});

// ADD MENU ITEM
router.post('/', protect, authorize('Admin', 'Employee'), async (req, res) => {
  try {
    const item = await Menu.create(req.body);
    res.status(201).json(item);
  } catch {
    res.status(400).json({ message: 'Unable to add menu item.' });
  }
});

// UPDATE MENU ITEM
router.put('/:id', protect, authorize('Admin', 'Employee'), async (req, res) => {
  try {
    const item = await Menu.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }

    res.json(item);
  } catch {
    res.status(400).json({ message: 'Unable to update menu item.' });
  }
});

// DELETE MENU ITEM
router.delete('/:id', protect, authorize('Admin', 'Employee'), async (req, res) => {
  try {
    const item = await Menu.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }

    res.json({ message: 'Menu item deleted.' });
  } catch {
    res.status(400).json({ message: 'Unable to delete menu item.' });
  }
});

export default router;
