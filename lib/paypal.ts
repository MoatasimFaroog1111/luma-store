import "server-only";
import { PRODUCTS } from "@/lib/products";

export const CURRENCY = "USD";
const MAX_QTY = 10;

const API_BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export class PayPalError extends Error {
  constructor(
    message: string,
    public status = 500,
    public issue?: string,
  ) {
    super(message);
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new PayPalError("PayPal is not configured on the server.");

  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new PayPalError(`PayPal auth failed (${res.status}).`);
  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    // Refresh a minute before PayPal expires it.
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

async function paypalFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init.headers,
    },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new PayPalError(
      data?.message || `PayPal request failed (${res.status}).`,
      res.status,
      data?.details?.[0]?.issue,
    );
  }
  return data;
}

const money = (n: number) => n.toFixed(2);

/** Validates a client cart and prices it from the server-side catalog. */
export function priceCart(input: unknown) {
  if (!input || typeof input !== "object") throw new PayPalError("Invalid cart.", 400);
  const lines = Object.entries(input as Record<string, unknown>).map(([id, qty]) => {
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) throw new PayPalError(`Unknown product: ${id}`, 400);
    if (!Number.isInteger(qty) || (qty as number) < 1 || (qty as number) > MAX_QTY) {
      throw new PayPalError(`Invalid quantity for ${id}.`, 400);
    }
    return { product, qty: qty as number };
  });
  if (lines.length === 0) throw new PayPalError("Cart is empty.", 400);
  // Work in cents to avoid floating point drift.
  const totalCents = lines.reduce((s, l) => s + Math.round(l.product.price * 100) * l.qty, 0);
  return { lines, total: totalCents / 100 };
}

export async function createOrder(cart: unknown): Promise<string> {
  const { lines, total } = priceCart(cart);
  const order = await paypalFetch("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: "Luma Store — Digital Products",
          amount: {
            currency_code: CURRENCY,
            value: money(total),
            breakdown: { item_total: { currency_code: CURRENCY, value: money(total) } },
          },
          items: lines.map(({ product, qty }) => ({
            name: product.name,
            sku: product.id,
            quantity: String(qty),
            category: "DIGITAL_GOODS",
            unit_amount: { currency_code: CURRENCY, value: money(product.price) },
          })),
        },
      ],
    }),
  });
  return order.id;
}

export interface CapturedOrder {
  productIds: string[];
  total: number;
  email?: string;
  name?: string;
}

/**
 * Captures the order on PayPal and returns what was bought, but only after
 * checking that the captured amount matches our own catalog prices.
 */
export async function captureOrder(orderId: string): Promise<CapturedOrder> {
  if (!/^[A-Z0-9]{5,40}$/.test(orderId)) throw new PayPalError("Invalid order id.", 400);
  const path = `/v2/checkout/orders/${orderId}`;

  let order;
  try {
    order = await paypalFetch(`${path}/capture`, { method: "POST" });
  } catch (err) {
    // A retried capture (e.g. after a network blip) should still deliver the goods.
    if (err instanceof PayPalError && err.issue === "ORDER_ALREADY_CAPTURED") {
      order = await paypalFetch(path);
    } else {
      throw err;
    }
  }

  const unit = order?.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  if (order?.status !== "COMPLETED" || capture?.status !== "COMPLETED") {
    throw new PayPalError("Payment was not completed.", 402);
  }

  const cart: Record<string, number> = {};
  for (const item of unit.items ?? []) cart[item.sku] = Number(item.quantity);
  const { lines, total } = priceCart(cart);

  if (capture.amount?.currency_code !== CURRENCY || capture.amount?.value !== money(total)) {
    throw new PayPalError("Paid amount does not match the order.", 402);
  }
  const payerName = [order.payer?.name?.given_name, order.payer?.name?.surname]
    .filter(Boolean)
    .join(" ");
  return {
    productIds: lines.map((l) => l.product.id),
    total,
    email: order.payer?.email_address || undefined,
    name: payerName || undefined,
  };
}
