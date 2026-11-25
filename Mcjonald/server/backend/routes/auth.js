
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  username: user.username,
  role: user.role
});

// CUSTOMER SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({
        message: 'All fields are required.'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: 'Invalid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must have at least 6 characters.'
      });
    }

    const existing = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: username.trim() }
      ]
    });

    if (existing) {
      return res.status(409).json({
        message: 'Email or username already registered.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      role: 'Customer'
    });

    res.status(201).json({
      message: 'Account created successfully.',
      token: createToken(user._id),
      user: safeUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: 'Incorrect email or password.'
      });
    }

    res.json({
      message: 'Login successful.',
      token: createToken(user._id),
      user: safeUser(user)
    });
  } catch {
    res.status(500).json({ message: 'Login failed.' });
  }
});

// CURRENT ACCOUNT
router.get('/me', protect, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

export default router;
