import "server-only";
import { neon } from "@neondatabase/serverless";

export interface OrderRecord {
  id: string; // PayPal order id
  email?: string;
  name?: string;
  total: number;
  currency: string;
  productIds: string[];
}

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

let schemaReady: Promise<unknown> | null = null;
function ensureSchema() {
  schemaReady ??= sql!`
    CREATE TABLE IF NOT EXISTS orders (
      id          text PRIMARY KEY,
      email       text,
      name        text,
      total       numeric(10, 2) NOT NULL,
      currency    text NOT NULL,
      product_ids text[] NOT NULL,
      created_at  timestamptz NOT NULL DEFAULT now()
    )`.catch((err) => {
    schemaReady = null; // retry on the next order
    throw err;
  });
  return schemaReady;
}

/**
 * Stores a paid order. Returns true if it is new, false if it was already
 * saved (a retried capture), or null when no database is configured.
 */
export async function saveOrder(order: OrderRecord): Promise<boolean | null> {
  if (!sql) return null;
  await ensureSchema();
  const rows = await sql`
    INSERT INTO orders (id, email, name, total, currency, product_ids)
    VALUES (${order.id}, ${order.email ?? null}, ${order.name ?? null},
            ${order.total}, ${order.currency}, ${order.productIds})
    ON CONFLICT (id) DO NOTHING
    RETURNING id`;
  return rows.length > 0;
}
