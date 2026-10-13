import { NextResponse } from "next/server";
import { commerceConfigured, encodeCart, priceFor, validateCart } from "@/lib/server-commerce";
import { paypalRequest } from "@/lib/paypal-server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!commerceConfigured()) return NextResponse.json({ error: "Checkout is not configured" }, { status: 503 });
  try {
    const cart = validateCart((await request.json()).cart);
    const data = await paypalRequest("/v2/checkout/orders", "POST", {
      intent: "CAPTURE",
      purchase_units: [{ custom_id: encodeCart(cart), amount: { currency_code: "USD", value: priceFor(cart) } }],
    });
    if (!data.id) throw new Error("Missing PayPal order");
    return NextResponse.json({ id: data.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof SyntaxError || (e instanceof Error && /Invalid/.test(e.message)))
      return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
    return NextResponse.json({ error: "Unable to initiate checkout" }, { status: 502 });
  }
}
