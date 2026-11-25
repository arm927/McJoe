
const API_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'mcjoe_token';

// Get authentication token
const getToken = () => localStorage.getItem(TOKEN_KEY);

// Common API request function
const request = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
};

/* =========================
   AUTHENTICATION
========================= */

export const registerUser = async ({ name, email, username, password }) => {
  const result = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password
    })
  });

  localStorage.setItem(TOKEN_KEY, result.token);
  return result.user;
};

export const loginUser = async (email, password) => {
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password
    })
  });

  localStorage.setItem(TOKEN_KEY, result.token);
  return result.user;
};

export const logoutUser = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('mcjoe_user');
};

/* =========================
   MENU
========================= */

const normalizeMenu = (item) => ({
  ...item,
  id: item._id || item.id
});

export const getMenuItems = async () => {
  const items = await request('/menu');
  return items.map(normalizeMenu);
};

export const createMenuItem = async (data) => {
  const item = await request('/menu', {
    method: 'POST',
    body: JSON.stringify(data)
  });

  return normalizeMenu(item);
};

export const updateMenuItem = async (id, data) => {
  const item = await request(`/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

  return normalizeMenu(item);
};

export const deleteMenuItem = async (id) => {
  await request(`/menu/${id}`, {
    method: 'DELETE'
  });

  return id;
};

/* =========================
   ORDERS
========================= */

const normalizeOrder = (order) => ({
  ...order,
  id: order._id || order.id,
  customer: typeof order.customer === 'object'
    ? order.customer?.name || 'Customer'
    : order.customer,
  customerId: typeof order.customer === 'object'
    ? order.customer?._id
    : order.customer,
  items: (order.items || []).map((item) => ({
    ...item,
    menuId: item.menuId?._id || item.menuId
  }))
});

export const getOrders = async () => {
  // No orders can be fetched until someone logs in.
  if (!getToken()) return [];

  const orders = await request('/orders');
  return orders.map(normalizeOrder);
};

export const createOrder = async (data) => {
  const order = await request('/orders', {
    method: 'POST',
    body: JSON.stringify({
      items: data.items,
      note: data.note || ''
    })
  });

  return normalizeOrder({
    ...order,
    customer: data.customer || 'Customer'
  });
};

export const updateOrder = async (id, data) => {
  if (!data.status) {
    throw new Error('An order status is required.');
  }

  const order = await request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: data.status
    })
  });

  return normalizeOrder(order);
};

export const deleteOrder = async (id) => {
  await request(`/orders/${id}`, {
    method: 'DELETE'
  });

  return id;
};
