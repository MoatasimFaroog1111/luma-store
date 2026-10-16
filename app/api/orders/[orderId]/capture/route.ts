import { after, NextResponse } from "next/server";
import { captureOrder, CURRENCY, PayPalError } from "@/lib/paypal";
import { createDownloadToken } from "@/lib/downloads";
import { saveOrder } from "@/lib/orders";
import { emailEnabled, sendReceipt } from "@/lib/email";

export async function POST(req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  let order;
  try {
    order = await captureOrder(orderId);
  } catch (err) {
    const status = err instanceof PayPalError ? err.status : 500;
    console.error(`Capture of order ${orderId} failed:`, err);
    return NextResponse.json(
      { error: status < 500 && err instanceof Error ? err.message : "Could not confirm payment." },
      { status },
    );
  }

  const downloads = order.productIds.map((id) => ({
    id,
    url: `/api/download/${createDownloadToken(orderId, id)}`,
  }));
  const emailTo = emailEnabled() ? order.email : undefined;

  // The customer has paid: bookkeeping and email must never block or fail the
  // download response, so they run after it is sent.
  after(async () => {
    try {
      await saveOrder({ id: orderId, currency: CURRENCY, ...order });
    } catch (err) {
      console.error(`Saving order ${orderId} failed:`, err);
    }
    if (!emailTo) return;
    try {
      const origin = process.env.SITE_URL || new URL(req.url).origin;
      await sendReceipt({
        to: emailTo,
        name: order.name,
        orderId,
        total: order.total,
        downloads: downloads.map((d) => ({ ...d, url: origin + d.url })),
      });
    } catch (err) {
      console.error(`Emailing receipt for order ${orderId} failed:`, err);
    }
  });

  return NextResponse.json({ downloads, email: emailTo });
}
