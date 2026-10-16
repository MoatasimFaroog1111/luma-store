"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  passwordMatches,
  SESSION_COOKIE,
  SESSION_HOURS,
} from "@/lib/admin";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    // Slow down password guessing.
    await new Promise((r) => setTimeout(r, 1000));
    redirect("/admin/login?error=1");
  }
  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_HOURS * 60 * 60,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
  redirect("/admin/login");
}
