"use client";

import { useMemo, useState } from "react";
import { PRODUCTS, type Product } from "@/lib/products";
import PayPalButton from "@/components/PayPalButton";

export default function Home() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addToCart = (id: string) => {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    setDrawerOpen(true);
  };
  const removeFromCart = (id: string) => {
    setCart((c) => {
      const n = { ...c };
      if (n[id] <= 1) delete n[id];
      else n[id]--;
      return n;
    });
  };
  const removeAll = (id: string) => {
    setCart((c) => {
      const n = { ...c };
      delete n[id];
      return n;
    });
  };

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === id)!, qty }))
        .filter((x) => x.product),
    [cart],
  );
  const total = cartItems.reduce((s, x) => s + x.product.price * x.qty, 0);
  const count = cartItems.reduce((s, x) => s + x.qty, 0);

  const checkout = () => {
    // Payment integration point: user connects their own PayPal/Stripe here.
    alert(
      "Checkout ready ✓\n\nHere you connect your PayPal/Stripe account (client-side or server route).\nTotal: $" + total.toFixed(2),
    );
  };

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div className="logo">
            <span className="logo-mark">✦</span> Luma
          </div>
          <nav className="nav">
            <a href="#products">Products</a>
            <a href="#why">Why digital</a>
            <a href="#faq">FAQ</a>
          </nav>
          <button className="cart-btn" onClick={() => setDrawerOpen(true)}>
            🛒 Cart {count > 0 && <span className="cart-count">{count}</span>}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <span className="badge">✨ Digital Products — 90%+ profit margin</span>
          <h1>Premium digital products,<br />instant delivery.</h1>
          <p>
            Planners, journals, AI prompts and templates. Buy once, download instantly,
            use forever. No shipping, no waiting — just value.
          </p>
        </div>
      </section>

      <section className="container" id="products">
        <div className="grid">
          {PRODUCTS.map((p) => (
            <Card key={p.id} product={p} onAdd={() => addToCart(p.id)} />
          ))}
        </div>
      </section>

      <section className="container" id="why" style={{ paddingBottom: 60 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>Why digital products?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18 }}>
          {[
            ["💸", "90%+ margins", "No inventory, no shipping, no production cost."],
            ["⚡", "Instant delivery", "Customers download immediately after checkout."],
            ["🌍", "Global reach", "Sell to anyone, anywhere, 24/7."],
            ["🔁", "Sell forever", "One product, unlimited sales, no restocking."],
          ].map(([icon, t, d]) => (
            <div key={t} style={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: 18, padding: 20 }}>
              <div style={{ fontSize: 30 }}>{icon}</div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>{t}</div>
              <div style={{ color: "var(--color-muted)", fontSize: 14, marginTop: 4 }}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--color-line)", padding: "30px 0", textAlign: "center", color: "var(--color-muted)", fontSize: 13 }}>
        <div className="container">Luma Store — premium digital products. © 2026</div>
      </footer>

      {/* Cart drawer */}
      <div className={`drawer-overlay ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />
      <div className={`drawer ${drawerOpen ? "open" : ""}`}>
        <h2>Your Cart</h2>
        {cartItems.length === 0 ? (
          <div className="empty-cart">Your cart is empty.<br />Add some products ✨</div>
        ) : (
          <div style={{ overflowY: "auto", flex: 1 }}>
            {cartItems.map(({ product, qty }) => (
              <div key={product.id} className="cart-item">
                <div className="thumb" style={{ background: product.gradient }}>{product.image}</div>
                <div className="info">
                  <div className="n">{product.name}</div>
                  <div className="p">${product.price} × {qty}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <button className="remove-btn" onClick={() => addToCart(product.id)}>+</button>
                  <button className="remove-btn" onClick={() => removeFromCart(product.id)}>−</button>
                  <button className="remove-btn" onClick={() => removeAll(product.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="cart-total">
          <div className="row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
          <div className="row grand"><span>Total</span><span>${total.toFixed(2)}</span></div>
          <button className="checkout-btn" onClick={checkout} disabled={cartItems.length === 0}>
            Checkout — ${total.toFixed(2)}
          </button>
          <div style={{ fontSize: 11, color: "var(--color-muted)", textAlign: "center", marginTop: 8 }}>
            🔒 Secure payment via PayPal / Stripe
          </div>
          <div style={{ marginTop: 12 }}>
            <PayPalButton amount={total} disabled={cartItems.length === 0} onSuccess={(d) => {
              alert("Payment successful! ✓\n\nThank you for your order.\nTransaction: " + (d?.id || "completed"));
              setCart({});
            }} />
          </div>
        </div>
      </div>
    </>
  );
}

function Card({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <div className="card">
      <div className="card-img" style={{ background: product.gradient }}>
        {product.badge && <span className="card-badge">{product.badge}</span>}
        <span>{product.image}</span>
      </div>
      <div className="card-body">
        <div className="card-cat">{product.category}</div>
        <div className="card-name">{product.name}</div>
        <div className="card-tag">{product.tagline}</div>
        <div className="card-foot">
          <div>
            <span className="price">${product.price}</span>
            {product.compareAt && <span className="compare">${product.compareAt}</span>}
          </div>
          <div className="stars">★ {product.rating} ({product.reviews.toLocaleString()})</div>
        </div>
        <button className="checkout-btn" style={{ marginTop: 10 }} onClick={onAdd}>
          Add to cart
        </button>
      </div>
    </div>
  );
}
