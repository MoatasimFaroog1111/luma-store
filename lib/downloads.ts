import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** How long a download link stays valid after purchase. */
export const LINK_TTL_DAYS = 7;

interface TokenPayload {
  o: string; // PayPal order id
  p: string; // product id
  e: number; // expiry, unix seconds
}

function secret(): string {
  const s = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!s || s.length < 32) throw new Error("DOWNLOAD_TOKEN_SECRET must be set (32+ chars).");
  return s;
}

const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

export function createDownloadToken(orderId: string, productId: string): string {
  const payload: TokenPayload = {
    o: orderId,
    p: productId,
    e: Math.floor(Date.now() / 1000) + LINK_TTL_DAYS * 24 * 60 * 60,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

/** Returns the product id if the token is authentic and unexpired, else null. */
export function verifyDownloadToken(token: string): string | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;

  const expected = Buffer.from(sign(data));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as TokenPayload;
    if (typeof payload.p !== "string" || payload.e < Date.now() / 1000) return null;
    return payload.p;
  } catch {
    return null;
  }
}
