
import { useCallback, useEffect, useState } from 'react';
import {
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Toast from './components/Toast.jsx';
import ItemModal from './components/ItemModal.jsx';

import Home from './pages/Home.jsx';
import Menu from './pages/Menu.jsx';
import Cart from './pages/cart.jsx';
import ManageMenu from './pages/ManageMenu.jsx';
import Orders from './pages/Orders.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import NotFound from './pages/NotFound.jsx';

import * as api from './services/api.js';

const STAFF_ROLES = ['Admin', 'Employee'];

/* =========================
   CUSTOMER ROUTE PROTECTION
========================= */

function RequireCustomer({ user, children }) {
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (user.role !== 'Customer') {
    return <Navigate to="/orders" replace />;
  }

  return children;
}

/* =========================
   STAFF ROUTE PROTECTION
========================= */

function RequireStaff({ user, children }) {
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!STAFF_ROLES.includes(user.role)) {
    return (
      <section className="container page">
        <div className="empty">
          <h2>Staff only</h2>
          <p>Your account doesn't have access to this page.</p>

          <Link className="btn btn-primary" to="/menu">
            Back to the menu
          </Link>
        </div>
      </section>
    );
  }

  return children;
}

/* =========================
   MAIN APP
========================= */

export default function App() {
  const navigate = useNavigate();

  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null);

  /* CART */

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mcjoe_cart')) || [];
    } catch {
      return [];
    }
  });

  /* LOGGED-IN USER */

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mcjoe_user')) || null;
    } catch {
      return null;
    }
  });

  /* =========================
     NOTIFICATIONS
  ========================= */

  const notify = useCallback((message, type = 'ok') => {
    setToast({
      message,
      type,
      key: Date.now()
    });
  }, []);

  /* =========================
     LOAD MENU AND ORDERS
  ========================= */

  useEffect(() => {
    const loadData = async () => {
      // Load menu independently.
      try {
        const menuItems = await api.getMenuItems();
        setMenu(menuItems);
      } catch (error) {
        console.error('Menu loading failed:', error);
        notify('Unable to load menu items.', 'error');
      }

      // Load orders independently.
      try {
        const orderItems = await api.getOrders();
        setOrders(orderItems);
      } catch (error) {
        console.error('Orders loading failed:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [notify]);

  /* =========================
     SAVE CART
  ========================= */

  useEffect(() => {
    try {
      localStorage.setItem('mcjoe_cart', JSON.stringify(cart));
    } catch {
      // Ignore storage errors.
    }
  }, [cart]);

  /* =========================
     AUTHENTICATION
  ========================= */

  const startSession = (safe) => {
    setUser(safe);

    try {
      localStorage.setItem(
        'mcjoe_user',
        JSON.stringify(safe)
      );
    } catch {
      // Ignore storage errors.
    }

    notify(`Welcome, ${safe.name}!`);
  };

  /* LOGIN */

  const login = async (email, password) => {
    const safe = await api.loginUser(email, password);

    if (!safe) {
      return false;
    }

    const userOrders = await api.getOrders();

    setOrders(userOrders);

    startSession(safe);

    return true;
  };

  /* SIGNUP */

  const signup = async (data) => {
    const safe = await api.registerUser(data);

    setOrders([]);

    startSession(safe);
  };

  /* LOGOUT */

  const logout = () => {
    api.logoutUser();

    setUser(null);
    setOrders([]);

    notify('Logged out');

    navigate('/');
  };

  /* =========================
     CART FUNCTIONS
  ========================= */

  const cartCount = cart.reduce(
    (sum, line) => sum + line.qty,
    0
  );

  const addToCart = (line) => {
    if (!user || user.role !== 'Customer') {
      setSelected(null);

      navigate(
        user ? '/orders' : '/login',
        {
          state: { from: '/cart' }
        }
      );

      notify('Only customer accounts can place orders');

      return;
    }

    const key = [
      line.menuId,
      line.size,
      [...(line.addons || [])].sort().join('+'),
      line.note
    ].join('|');

    setCart((previous) => {
      const found = previous.find(
        (item) => item.key === key
      );

      if (found) {
        return previous.map((item) =>
          item.key === key
            ? { ...item, qty: item.qty + line.qty }
            : item
        );
      }

      return [
        ...previous,
        { ...line, key }
      ];
    });

    notify(`${selected?.name || 'Item'} added to cart`);

    setSelected(null);
  };

  const updateQty = (key, qty) => {
    setCart((previous) =>
      qty < 1
        ? previous.filter((item) => item.key !== key)
        : previous.map((item) =>
            item.key === key
              ? { ...item, qty }
              : item
          )
    );
  };

  const removeLine = (key) => {
    setCart((previous) =>
      previous.filter((item) => item.key !== key)
    );
  };

  /* =========================
     MENU MANAGEMENT
  ========================= */

  const addMenuItem = async (data) => {
    const item = await api.createMenuItem(data);

    setMenu((previous) => [
      item,
      ...previous
    ]);

    notify(`"${item.name}" added to the menu`);
  };

  const editMenuItem = async (id, data) => {
    const item = await api.updateMenuItem(id, data);

    setMenu((previous) =>
      previous.map((menuItem) =>
        menuItem.id === id
          ? item
          : menuItem
      )
    );

    notify(`"${item.name}" updated`);
  };

  const removeMenuItem = async (id) => {
    const name = menu.find(
      (item) => item.id === id
    )?.name;

    await api.deleteMenuItem(id);

    setMenu((previous) =>
      previous.filter((item) => item.id !== id)
    );

    notify(`"${name}" deleted`, 'warn');
  };

  /* =========================
     ORDER MANAGEMENT
  ========================= */

  const addOrder = async (data) => {
    const order = await api.createOrder(data);

    setOrders((previous) => [
      order,
      ...previous
    ]);

    notify(`Order for ${order.customer} created`);
  };

  const editOrder = async (id, data) => {
    const order = await api.updateOrder(id, data);

    setOrders((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, ...order }
          : item
      )
    );

    notify('Order updated');
  };

  const removeOrder = async (id) => {
    await api.deleteOrder(id);

    setOrders((previous) =>
      previous.filter((item) => item.id !== id)
    );

    notify('Order deleted', 'warn');
  };

  /* =========================
     CUSTOMER CHECKOUT
  ========================= */

  const checkout = async ({ customer, note }) => {
    await addOrder({
      customer,
      note,
      status: 'Pending',
      items: cart.map(({ key, ...line }) => line)
    });

    setCart([]);

    notify('Your order has been placed!');
  };

  /* =========================
     APP DISPLAY
  ========================= */

  return (
    <div className="app">

      <Navbar
        cartCount={cartCount}
        user={user}
        onLogout={logout}
      />

      <main>
        {loading ? (
          <p className="loading">
            Brewing…
          </p>
        ) : (
          <Routes>

            {/* HOME */}

            <Route
              path="/"
              element={
                <Home
                  menu={menu}
                  orders={orders}
                  onSelect={setSelected}
                />
              }
            />

            {/* MENU */}

            <Route
              path="/menu"
              element={
                <Menu
                  menu={menu}
                  onSelect={setSelected}
                />
              }
            />

            {/* CUSTOMER CART */}

            <Route
              path="/cart"
              element={
                <RequireCustomer user={user}>
                  <Cart
                    cart={cart}
                    menu={menu}
                    user={user}
                    onUpdateQty={updateQty}
                    onRemove={removeLine}
                    onCheckout={checkout}
                  />
                </RequireCustomer>
              }
            />

            {/* LOGIN */}

            <Route
              path="/login"
              element={
                <Login
                  user={user}
                  onLogin={login}
                />
              }
            />

            {/* SIGNUP */}

            <Route
              path="/signup"
              element={
                <Signup
                  user={user}
                  onSignup={signup}
                />
              }
            />

            {/* STAFF MENU MANAGEMENT */}

            <Route
              path="/manage-menu"
              element={
                <RequireStaff user={user}>
                  <ManageMenu
                    menu={menu}
                    onAdd={addMenuItem}
                    onEdit={editMenuItem}
                    onDelete={removeMenuItem}
                  />
                </RequireStaff>
              }
            />

            {/* ORDERS */}

            <Route
              path="/orders"
              element={
                user ? (
                  <Orders
                    orders={
                      user.role === 'Customer'
                        ? orders.filter(
                            (order) =>
                              order.customerId === user.id
                          )
                        : orders
                    }
                    menu={menu}
                    isStaff={STAFF_ROLES.includes(user.role)}
                    onAdd={addOrder}
                    onEdit={editOrder}
                    onDelete={removeOrder}
                  />
                ) : (
                  <Navigate
                    to="/login"
                    replace
                    state={{ from: '/orders' }}
                  />
                )
              }
            />

            {/* UNKNOWN PAGE */}

            <Route
              path="*"
              element={<NotFound />}
            />

          </Routes>
        )}
      </main>

      <Footer />

      {/* ITEM MODAL */}

      {selected && (
        <ItemModal
          item={selected}
          onClose={() => setSelected(null)}
          onAdd={addToCart}
        />
      )}

      {/* TOAST NOTIFICATIONS */}

      <Toast
        toast={toast}
        onDone={() => setToast(null)}
      />

    </div>
  );
}
