/**
 * Data service layer (localStorage for now).
 * When the Express + MongoDB backend is ready, replace the bodies with fetch calls.
 */
import { seedMenu, seedOrders } from '../data/seed.js';

const KEYS = { menu: 'mcjoe_menu', orders: 'mcjoe_orders', users: 'mcjoe_users' };

const read = (key, seed) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore and fall back to seed */
  }
  write(key, seed);
  return seed;
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: data lasts for this session only */
  }
};

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const sha256 = async (text) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};


/* ---------- Users: Express + MongoDB ---------- */

const API_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'mcjoe_token';

export const registerUser = async ({ name, email, username, password }) => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed.');
  }

  localStorage.setItem(TOKEN_KEY, data.token);

  return data.user;
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed.');
  }

  localStorage.setItem(TOKEN_KEY, data.token);

  return data.user;
};

export const logoutUser = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('mcjoe_user');
};


/* ---------- Menu items: MongoDB ---------- */

const getToken = () => localStorage.getItem('mcjoe_token');

const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken()
        ? { Authorization: `Bearer ${getToken()}` }
        : {}),
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
};

const normalizeMenuItem = (item) => ({
  ...item,
  id: item._id || item.id
});

export const getMenuItems = async () => {
  const items = await apiRequest('/menu');
  return items.map(normalizeMenuItem);
};

export const createMenuItem = async (data) => {
  const item = await apiRequest('/menu', {
    method: 'POST',
    body: JSON.stringify(data)
  });

  return normalizeMenuItem(item);
};

export const updateMenuItem = async (id, data) => {
  const item = await apiRequest(`/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

  return normalizeMenuItem(item);
};

export const deleteMenuItem = async (id) => {
  await apiRequest(`/menu/${id}`, {
    method: 'DELETE'
  });

  return id;
};


/* ---------- Orders ---------- */

/* ---------- Orders: MongoDB ---------- */

const normalizeOrder = (order) => ({
  ...order,
  id: order._id || order.id,
  customer: typeof order.customer === 'object'
    ? order.customer?.name || 'Customer'
    : order.customer,
  customerId: typeof order.customer === 'object'
    ? order.customer?._id
    : order.customer,
  createdAt: order.createdAt
});

export const getOrders = async () => {
  if (!getToken()) return [];

  const orders = await apiRequest('/orders');

  return orders.map(normalizeOrder);
};

export const createOrder = async (data) => {
  const order = await apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify({
      items: data.items,
      note: data.note || ''
    })
  });

  return normalizeOrder(order);
};

export const updateOrder = async (id, data) => {
  if (!data.status) {
    throw new Error('Only order status updates are currently supported.');
  }

  const order = await apiRequest(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: data.status })
  });

  return normalizeOrder(order);
};

export const deleteOrder = async (id) => {
  await apiRequest(`/orders/${id}`, {
    method: 'DELETE'
  });

  return id;
};
