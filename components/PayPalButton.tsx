"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    paypal?: any;
  }
}

export interface Download {
  id: string;
  url: string;
}

interface PayPalButtonProps {
  items: Record<string, number>;
  currency?: string;
  disabled?: boolean;
  onSuccess?: (downloads: Download[]) => void;
}

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/**
 * PayPal smart button. Orders are created and captured by our own API routes,
 * so prices come from the server catalog and payment is verified before any
 * download link is issued.
 */
export default function PayPalButton({
  items,
  currency = "USD",
  disabled = false,
  onSuccess,
}: PayPalButtonProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Read the latest cart/callback at click time without re-rendering the button.
  const itemsRef = useRef(items);
  const onSuccessRef = useRef(onSuccess);
  itemsRef.current = items;
  onSuccessRef.current = onSuccess;

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  useEffect(() => {
    if (!clientId) {
      setError("PayPal is not configured yet (missing Client ID).");
      return;
    }
    if (window.paypal) {
      setReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId,
    )}&currency=${currency}`;
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError("Failed to load PayPal SDK.");
    document.head.appendChild(script);
  }, [clientId, currency]);

  useEffect(() => {
    if (!ready || disabled || !containerRef.current || !window.paypal) return;
    containerRef.current.innerHTML = "";
    window.paypal
      .Buttons({
        style: { layout: "vertical", color: "gold", shape: "pill", label: "paypal" },
        createOrder: async () => {
          setError(null);
          const { id } = await postJson("/api/orders", { items: itemsRef.current });
          return id;
        },
        onApprove: async (data: { orderID: string }) => {
          const { downloads } = await postJson(
            `/api/orders/${encodeURIComponent(data.orderID)}/capture`,
          );
          onSuccessRef.current?.(downloads);
        },
        onError: (err: any) => {
          setError("Payment error: " + (err?.message || "unknown"));
        },
      })
      .render(containerRef.current);
  }, [ready, disabled]);

  if (disabled) return null;
  return (
    <>
      {error && (
        <div
          style={{
            background: "var(--color-accent-soft)",
            color: "var(--color-accent-ink)",
            padding: "12px 14px",
            borderRadius: 12,
            fontSize: 13,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}
      <div ref={containerRef} />
    </>
  );
}
