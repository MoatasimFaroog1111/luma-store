import { NextResponse } from "next/server";
import { createOrder, PayPalError } from "@/lib/paypal";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const id = await createOrder(body?.items);
    return NextResponse.json({ id });
  } catch (err) {
    const status = err instanceof PayPalError ? err.status : 500;
    console.error("Create order failed:", err);
    return NextResponse.json(
      { error: status < 500 && err instanceof Error ? err.message : "Could not start checkout." },
      { status },
    );
  }
}
