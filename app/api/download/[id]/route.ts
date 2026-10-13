import { verifyDownload } from "@/lib/server-commerce";
import { fetchPrivatePdf } from "@/lib/r2-private";
import { PRODUCTS } from "@/lib/products";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!PRODUCTS.some(p => p.id === id) || !verifyDownload(token, id))
    return new Response("Unauthorized", { status: 403, headers: { "Cache-Control": "no-store" } });
  try {
    const pdf = await fetchPrivatePdf(id);
    if (!pdf.ok || !pdf.body) return new Response("Product unavailable", { status: 503 });
    return new Response(pdf.body, { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${id}.pdf"`,
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    } });
  } catch { return new Response("Download temporarily unavailable", { status: 503 }); }
}
