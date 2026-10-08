"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonProps {
  amount: number;
  currency?: string;
  disabled?: boolean;
  onSuccess?: (details: any) => void;
}

/**
 * PayPal smart button. Uses the client-side JS SDK, which only needs the
 * public Client ID (NEXT_PUBLIC_PAYPAL_CLIENT_ID). The money lands directly
 * in the store owner's PayPal account.
 */
export default function PayPalButton({
  amount,
  currency = "USD",
  disabled = false,
  onSuccess,
}: PayPalButtonProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  useEffect(() => {
    if (!clientId) {
      setError("PayPal is not configured yet (missing Client ID).");
      return;
    }
    if (document.querySelector('script[src*="paypal.com/sdk/js"]')) {
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
    if (!ready || !containerRef.current || !window.paypal) return;
    containerRef.current.innerHTML = "";
    window.paypal
      .Buttons({
        style: { layout: "vertical", color: "gold", shape: "pill", label: "paypal" },
        createOrder: (_data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [
              {
                description: "Luma Store — Digital Products",
                amount: { currency_code: currency, value: amount.toFixed(2) },
              },
            ],
          });
        },
        onApprove: async (_data: any, actions: any) => {
          const details = await actions.order.capture();
          onSuccess?.(details);
        },
        onError: (err: any) => {
          setError("Payment error: " + (err?.message || "unknown"));
        },
      })
      .render(containerRef.current);
  }, [ready, amount, currency, onSuccess]);

  if (disabled) return null;
  if (error) {
    return (
      <div
        style={{
          background: "var(--color-accent-soft)",
          color: "var(--color-accent-ink)",
          padding: "12px 14px",
          borderRadius: 12,
          fontSize: 13,
          textAlign: "center",
        }}
      >
        {error}
      </div>
    );
  }
  return <div ref={containerRef} />;
}
