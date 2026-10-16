import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "luma_admin";
export const SESSION_HOURS = 12;

/** The admin password, or null if the dashboard is disabled. */
export function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length >= 12 ? p : null;
}

const digest = (s: string) => createHash("sha256").update(s).digest();

export function passwordMatches(input: string): boolean {
  const password = adminPassword();
  // Hashing first gives equal-length buffers, so the comparison is constant-time.
  return password !== null && timingSafeEqual(digest(input), digest(password));
}

// Sessions are signed with the password itself, so changing ADMIN_PASSWORD
// signs everyone out.
const sign = (exp: number, password: string) =>
  createHmac("sha256", password).update(`admin-session:${exp}`).digest("base64url");

export function createSessionToken(): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_HOURS * 60 * 60;
  return `${exp}.${sign(exp, adminPassword()!)}`;
}

export async function isAdmin(): Promise<boolean> {
  const password = adminPassword();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!password || !token) return false;

  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!Number.isInteger(exp) || exp < Date.now() / 1000 || !sig) return false;

  const expected = Buffer.from(sign(exp, password));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
