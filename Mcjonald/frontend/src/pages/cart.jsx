
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { peso } from '../components/MenuCard.jsx';
import { CATEGORY_ICONS } from '../data/seed.js';

export default function Cart({
  cart = [],
  menu = [],
  user = null,
  onUpdateQty,
  onRemove,
  onCheckout
}) {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(user?.name || '');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Support both MongoDB _id and frontend id.
  const getMenuId = (item) => String(item?._id || item?.id || '');

  const lines = cart
    .map((line) => ({
      ...line,
      item: menu.find(
        (item) => getMenuId(item) === String(line.menuId)
      )
    }))
    .filter((line) => line.item);

  const total = lines.reduce(
    (sum, line) =>
      sum + Number(line.price ?? line.item.price ?? 0) * line.qty,
    0
  );

  const count = lines.reduce(
    (sum, line) => sum + line.qty,
    0
  );

  const placeOrder = async (e) => {
    e.preventDefault();

    if (!customer.trim()) {
      setError('Customer name is required.');
      return;
    }

    if (!lines.length) {
      setError('Your cart is empty.');
      return;
    }

    try {
      setBusy(true);
      setError('');

      await onCheckout({
        customer: customer.trim(),
        note: note.trim()
      });

      navigate('/orders');
    } catch (err) {
      console.error('Checkout failed:', err);
      setError(err.message || 'Unable to place your order.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="container page">

      <div className="section-head">
        <div>
          <h1>Your Cart</h1>
          <p className="muted">
            {count} {count === 1 ? 'item' : 'items'} in your cart.
          </p>
        </div>

        <Link className="btn btn-ghost" to="/menu">
          Add more items
        </Link>
      </div>

      {lines.length ? (
        <div className="cart-layout">

          <div className="cart-list">
            {lines.map((line) => {
              const itemPrice = Number(
                line.price ?? line.item.price ?? 0
              );

              return (
                <article
                  className="card cart-item"
                  key={line.key}
                >
                  <div className="cart-art" aria-hidden="true">
                    {CATEGORY_ICONS[line.item.category] || '☕'}
                  </div>

                  <div className="cart-info">

                    <div className="cart-item-head">
                      <div>
                        <h3>{line.item.name}</h3>

                        <span className="muted small">
                          {[
                            line.size,
                            ...(line.addons || [])
                          ].filter(Boolean).join(' · ') || line.item.category}
                        </span>

                        {line.note && (
                          <div className="note small">
                            "{line.note}"
                          </div>
                        )}
                      </div>

                      <span className="price">
                        {peso(itemPrice)}
                      </span>
                    </div>

                    <div className="cart-item-actions">

                      <div className="quantity-control">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQty(line.key, line.qty - 1)
                          }
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>

                        <span>{line.qty}</span>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQty(line.key, line.qty + 1)
                          }
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <strong>
                        {peso(itemPrice * line.qty)}
                      </strong>

                      <button
                        type="button"
                        className="btn btn-sm btn-danger-ghost"
                        onClick={() => onRemove(line.key)}
                      >
                        Remove
                      </button>

                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <form
            className="card cart-summary"
            onSubmit={placeOrder}
            noValidate
          >
            <h3>Order summary</h3>

            <div className="sum-row">
              <span>Items</span>
              <strong>{count}</strong>
            </div>

            <div className="sum-row cart-total">
              <span>Total</span>
              <strong>{peso(total)}</strong>
            </div>

            <label>
              Customer name

              <input
                value={customer}
                onChange={(e) => {
                  setCustomer(e.target.value);
                  setError('');
                }}
                placeholder="Enter your name"
                required
              />
            </label>

            <label>
              Note (optional)

              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. For here"
              />
            </label>

            {error && (
              <span className="error">{error}</span>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
            >
              {busy ? 'Placing order...' : 'Place order'}
            </button>

          </form>
        </div>
      ) : (
        <div className="empty">
          <h2>Your cart is empty</h2>

          <p>
            {cart.length
              ? 'Some items could not be matched with the current menu.'
              : 'Pick something from the menu to get started.'}
          </p>

          <Link className="btn btn-primary" to="/menu">
            Browse the menu
          </Link>
        </div>
      )}

    </section>
  );
}
