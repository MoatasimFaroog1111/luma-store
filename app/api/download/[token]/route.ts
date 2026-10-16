import { readFile } from "node:fs/promises";
import path from "node:path";
import { PRODUCTS } from "@/lib/products";
import { verifyDownloadToken } from "@/lib/downloads";

const DOWNLOADS_DIR = path.join(process.cwd(), "private", "downloads");

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const productId = verifyDownloadToken(token);
  // Only ever serve files for known catalog ids, never a path taken from the request.
  const product = productId && PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    return new Response("This download link is invalid or has expired.", { status: 403 });
  }

  const file = await readFile(path.join(DOWNLOADS_DIR, `${product.id}.pdf`));
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${product.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
