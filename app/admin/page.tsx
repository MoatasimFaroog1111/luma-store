import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getDashboard, type Dashboard } from "@/lib/orders";
import { PRODUCTS } from "@/lib/products";
import { logout } from "./actions";

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const productName = (id: string) => PRODUCTS.find((p) => p.id === id)?.name ?? id;

const card: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-line)",
  borderRadius: 18,
  padding: 20,
};
const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontSize: 12, color: "var(--color-muted)", fontWeight: 600, borderBottom: "1px solid var(--color-line)" };
const td: React.CSSProperties = { padding: "10px 12px", fontSize: 14, borderBottom: "1px solid var(--color-line)", verticalAlign: "top" };

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  let data: Dashboard | null = null;
  let error = false;
  try {
    data = await getDashboard();
  } catch (err) {
    console.error("Loading admin dashboard failed:", err);
    error = true;
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>✦ Sales</h1>
        <form action={logout}>
          <button type="submit" style={{ background: "none", border: "1px solid var(--color-line)", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>
            Sign out
          </button>
        </form>
      </div>

      {error ? (
        <div style={card}>Could not load orders from the database. Check the server logs.</div>
      ) : !data ? (
        <div style={card}>
          No database connected. Set <code>DATABASE_URL</code> to start recording orders.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
            {[
              ["Revenue (30 days)", usd(data.revenue30d)],
              ["Orders (30 days)", data.orders30d.toLocaleString()],
              ["Revenue (all time)", usd(data.revenue)],
              ["Orders (all time)", data.orders.toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} style={card}>
                <div style={{ fontSize: 13, color: "var(--color-muted)" }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <div style={card}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>Top products</h2>
              {data.topProducts.length === 0 ? (
                <p style={{ color: "var(--color-muted)", fontSize: 14 }}>No sales yet.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={th}>Product</th><th style={{ ...th, textAlign: "right" }}>Orders</th></tr></thead>
                  <tbody>
                    {data.topProducts.map((p) => (
                      <tr key={p.id}>
                        <td style={td}>{productName(p.id)}</td>
                        <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{p.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ ...card, minWidth: 0, overflowX: "auto" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>Recent orders</h2>
              {data.recent.length === 0 ? (
                <p style={{ color: "var(--color-muted)", fontSize: 14 }}>No orders yet.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                  <thead>
                    <tr><th style={th}>Date (UTC)</th><th style={th}>Customer</th><th style={th}>Products</th><th style={{ ...th, textAlign: "right" }}>Total</th></tr>
                  </thead>
                  <tbody>
                    {data.recent.map((o) => (
                      <tr key={o.id}>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>{o.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                        <td style={td}>
                          {o.name && <div>{o.name}</div>}
                          <div style={{ color: "var(--color-muted)", fontSize: 13 }}>{o.email ?? "—"}</div>
                        </td>
                        <td style={td}>{o.productIds.map(productName).join(", ")}</td>
                        <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{usd(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
