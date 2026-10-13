import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { PRODUCTS } from "./products";

export type CartEntry = { id: string; qty: number };
const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

export function validateCart(input: unknown): CartEntry[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > PRODUCTS.length) throw new Error("Invalid cart");
  const seen = new Set<string>();
  return input.map((entry: unknown) => {
    if (!entry || typeof entry !== "object") throw new Error("Invalid item");
    const e = entry as Record<string, unknown>;
    if (typeof e.id !== "string" || !byId.has(e.id) || seen.has(e.id)) throw new Error("Invalid product");
    if (!Number.isInteger(e.qty) || (e.qty as number) < 1 || (e.qty as number) > 10) throw new Error("Invalid quantity");
    seen.add(e.id);
    return { id: e.id, qty: e.qty as number };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

export function priceFor(cart: CartEntry[]): string {
  const cents = cart.reduce((sum, e) => sum + Math.round(byId.get(e.id)!.price * 100) * e.qty, 0);
  return (cents / 100).toFixed(2);
}

export function encodeCart(cart: CartEntry[]): string {
  return cart.map(e => `${PRODUCTS.findIndex(p => p.id === e.id)}:${e.qty}`).join(",");
}
export function decodeCart(value: string): CartEntry[] {
  const parts = value.split(",").map(v => {
    const m = /^(\d+):(\d+)$/.exec(v);
    if (!m || !PRODUCTS[Number(m[1])]) throw new Error("Invalid order metadata");
    return { id: PRODUCTS[Number(m[1])].id, qty: Number(m[2]) };
  });
  return validateCart(parts);
}
export function signDownloads(ids: string[], orderId: string): string {
  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret || secret.length < 32) throw new Error("Download signing is not configured");
  const payload = Buffer.from(JSON.stringify({ ids, orderId, exp: Date.now() + 15 * 60_000 })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
export function verifyDownload(token: string, id: string): boolean {
  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret || secret.length < 32 || token.length > 4096) return false;
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra !== undefined) return false;
  const expected = createHmac("sha256", secret).update(payload).digest();
  let actual: Buffer;
  try { actual = Buffer.from(sig, "base64url"); } catch { return false; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof data.exp === "number" && data.exp > Date.now() && Array.isArray(data.ids) && data.ids.includes(id);
  } catch { return false; }
}
export function commerceConfigured(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET &&
    process.env.DOWNLOAD_SIGNING_SECRET && process.env.DOWNLOAD_SIGNING_SECRET.length >= 32 &&
    process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET);
}
