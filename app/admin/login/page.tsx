import { redirect } from "next/navigation";
import { adminPassword, isAdmin } from "@/lib/admin";
import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const enabled = adminPassword() !== null;

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: 18, padding: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 16px" }}>✦ Luma Admin</h1>
      {!enabled ? (
        <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
          The dashboard is disabled. Set <code>ADMIN_PASSWORD</code> (12+ characters) to enable it.
        </p>
      ) : (
        <form action={login}>
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="current-password"
            required
            autoFocus
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--color-line)", fontSize: 15 }}
          />
          {error && (
            <div style={{ color: "var(--color-danger)", fontSize: 13, marginTop: 8 }}>Wrong password.</div>
          )}
          <button className="checkout-btn" type="submit" style={{ marginTop: 14 }}>
            Sign in
          </button>
        </form>
      )}
    </div>
  );
}
