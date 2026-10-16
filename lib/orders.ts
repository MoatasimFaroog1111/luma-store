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

export interface Dashboard {
  revenue: number;
  orders: number;
  revenue30d: number;
  orders30d: number;
  topProducts: { id: string; orders: number }[];
  recent: (OrderRecord & { createdAt: Date })[];
}

/** Sales summary for the admin page, or null when no database is configured. */
export async function getDashboard(): Promise<Dashboard | null> {
  if (!sql) return null;
  await ensureSchema();
  const [[totals], top, recent] = await Promise.all([
    sql`
      SELECT coalesce(sum(total), 0) AS revenue,
             count(*) AS orders,
             coalesce(sum(total) FILTER (WHERE created_at > now() - interval '30 days'), 0) AS revenue_30d,
             count(*) FILTER (WHERE created_at > now() - interval '30 days') AS orders_30d
      FROM orders`,
    sql`
      SELECT pid AS id, count(*) AS orders
      FROM orders, unnest(product_ids) AS pid
      GROUP BY pid ORDER BY count(*) DESC`,
    sql`
      SELECT id, email, name, total, currency, product_ids, created_at
      FROM orders ORDER BY created_at DESC LIMIT 50`,
  ]);
  // Postgres numeric and bigint values arrive as strings.
  return {
    revenue: Number(totals.revenue),
    orders: Number(totals.orders),
    revenue30d: Number(totals.revenue_30d),
    orders30d: Number(totals.orders_30d),
    topProducts: top.map((r) => ({ id: r.id, orders: Number(r.orders) })),
    recent: recent.map((r) => ({
      id: r.id,
      email: r.email ?? undefined,
      name: r.name ?? undefined,
      total: Number(r.total),
      currency: r.currency,
      productIds: r.product_ids,
      createdAt: new Date(r.created_at),
    })),
  };
}
