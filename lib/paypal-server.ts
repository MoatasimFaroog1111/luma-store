import "server-only";
function base(): string {
  return process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}
async function token(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PayPal not configured");
  const res = await fetch(base() + "/v1/oauth2/token", {
    method: "POST", cache: "no-store",
    headers: { Authorization: "Basic " + Buffer.from(id + ":" + secret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("PayPal authorization failed");
  const data = await res.json();
  return data.access_token;
}
export async function paypalRequest(path: string, method: "GET" | "POST", body?: unknown): Promise<any> {
  const accessToken = await token();
  const res = await fetch(base() + path, { method, cache: "no-store",
    headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json",
      Prefer: "return=representation" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw new Error("PayPal request failed (" + res.status + ")");
  return res.json();
}
