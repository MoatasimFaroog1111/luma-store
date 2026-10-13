"use client";
import { useEffect, useRef, useState } from "react";
declare global { interface Window { paypal?: any } }
type Item = { id: string; qty: number };
interface Props { cart: Item[]; disabled?: boolean; onSuccess: (ids: string[], token: string) => void }
export default function PayPalButton({ cart, disabled, onSuccess }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  const cartKey = JSON.stringify(cart);
  useEffect(() => {
    if (!clientId) { setError("Checkout is not configured. Please contact the store."); return; }
    if (window.paypal) { setReady(true); return; }
    const existing = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (existing) { existing.addEventListener("load", () => setReady(true), { once: true }); return; }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError("Payment provider is unavailable.");
    document.head.appendChild(script);
  }, [clientId]);
  useEffect(() => {
    if (!ready || disabled || cart.length === 0 || !containerRef.current || !window.paypal) return;
    const container = containerRef.current;
    container.innerHTML = "";
    const buttons = window.paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "pill" },
      createOrder: async () => {
        const res = await fetch("/api/checkout/create", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart: JSON.parse(cartKey) }),
        });
        const data = await res.json();
        if (!res.ok || !data.id) throw new Error(data.error || "Could not create order");
        return data.id;
      },
      onApprove: async (data: { orderID: string }) => {
        const res = await fetch("/api/checkout/capture", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderID }),
        });
        const result = await res.json();
        if (!res.ok || !result.token) { setError(result.error || "Payment verification failed. Contact support."); return; }
        onSuccessRef.current(result.ids, result.token);
      },
      onError: () => setError("Checkout failed. If you were charged, contact support before paying again."),
    });
    buttons.render(container);
    return () => { if (typeof buttons.close === "function") buttons.close(); };
  }, [ready, disabled, cartKey, cart.length]);
  if (disabled) return null;
  return error ? <div role="alert" style={{ padding: 12, color: "darkred" }}>{error}</div> : <div ref={containerRef} />;
}
