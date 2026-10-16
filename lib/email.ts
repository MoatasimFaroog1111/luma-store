import "server-only";
import { PRODUCTS } from "@/lib/products";
import { LINK_TTL_DAYS } from "@/lib/downloads";

export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY);

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

interface ReceiptInput {
  to: string;
  name?: string;
  orderId: string;
  total: number;
  downloads: { id: string; url: string }[]; // absolute URLs
}

/** Sends the order receipt with download links via the Resend API. */
export async function sendReceipt({ to, name, orderId, total, downloads }: ReceiptInput) {
  const rows = downloads
    .map(({ id, url }) => {
      const product = PRODUCTS.find((p) => p.id === id);
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #e3ecea">${escapeHtml(product?.name ?? id)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e3ecea;text-align:right">
          <a href="${escapeHtml(url)}" style="background:#0e3a3a;color:#eaf4f2;padding:8px 14px;border-radius:8px;text-decoration:none;font-weight:600">Download</a>
        </td>
      </tr>`;
    })
    .join("");

  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#0b2626">
    <h2 style="margin-bottom:4px">Thank you${name ? `, ${escapeHtml(name)}` : ""}!</h2>
    <p style="color:#4a6563;margin-top:0">Your Luma order is confirmed. Your files are ready below.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>
    <p style="font-size:14px">Total paid: <strong>$${total.toFixed(2)}</strong><br>
    Order reference: ${escapeHtml(orderId)}</p>
    <p style="font-size:13px;color:#4a6563">These links stay valid for ${LINK_TTL_DAYS} days — please save your files.
    Need help? Just reply to this email.</p>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      // Resend dedupes on this key, so a retried send never emails twice.
      "Idempotency-Key": `receipt-${orderId}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Luma Store <onboarding@resend.dev>",
      to: [to],
      ...(process.env.EMAIL_REPLY_TO && { reply_to: process.env.EMAIL_REPLY_TO }),
      subject: "Your Luma downloads are ready",
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend failed (${res.status}): ${await res.text()}`);
}
