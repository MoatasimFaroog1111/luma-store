import { NextResponse } from "next/server";
import { commerceConfigured, decodeCart, priceFor, signDownloads } from "@/lib/server-commerce";
import { paypalRequest } from "@/lib/paypal-server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!commerceConfigured()) return NextResponse.json({ error: "Checkout is not configured" }, { status: 503 });
  try {
    const input = await request.json();
    if (!input || typeof input.orderId !== "string" || !/^[A-Z0-9]{10,30}$/.test(input.orderId))
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    const order = await paypalRequest("/v2/checkout/orders/" + input.orderId, "GET");
    const units = order.purchase_units;
    if (order.id !== input.orderId || !Array.isArray(units) || units.length !== 1) throw new Error("Order mismatch");
    const cart = decodeCart(units[0].custom_id || "");
    if (units[0].amount?.currency_code !== "USD" || units[0].amount?.value !== priceFor(cart))
      throw new Error("Order amount mismatch");
    const result = order.status === "COMPLETED" ? order : await paypalRequest("/v2/checkout/orders/" + input.orderId + "/capture", "POST", {}, "luma-capture-" + input.orderId);
    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    if (result.id !== input.orderId || result.status !== "COMPLETED" || capture?.status !== "COMPLETED" ||
      capture?.amount?.value !== priceFor(cart) || capture?.amount?.currency_code !== "USD")
      throw new Error("Payment not completed");
    const ids = cart.map(e => e.id);
    return NextResponse.json({ token: signDownloads(ids, input.orderId), ids },
      { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Payment could not be verified; contact support before retrying" }, { status: 400 });
  }
}
