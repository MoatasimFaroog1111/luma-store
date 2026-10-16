import { NextResponse } from "next/server";
import { captureOrder, PayPalError } from "@/lib/paypal";
import { createDownloadToken } from "@/lib/downloads";

export async function POST(_req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  try {
    const productIds = await captureOrder(orderId);
    const downloads = productIds.map((id) => ({
      id,
      url: `/api/download/${createDownloadToken(orderId, id)}`,
    }));
    return NextResponse.json({ downloads });
  } catch (err) {
    const status = err instanceof PayPalError ? err.status : 500;
    console.error(`Capture of order ${orderId} failed:`, err);
    return NextResponse.json(
      { error: status < 500 && err instanceof Error ? err.message : "Could not confirm payment." },
      { status },
    );
  }
}
