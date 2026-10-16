import { NextResponse } from "next/server";
import { adminCookie, createAdminSession, isAdminConfigured, verifyCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isAdminConfigured()) return NextResponse.json({ error: "Configura las variables ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_SESSION_SECRET." }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { email?: string; password?: string };
  if (!verifyCredentials(body.email ?? "", body.password ?? "")) return NextResponse.json({ error: "Credenciales incorrectas." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, createAdminSession(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: adminCookie.maxAge });
  return response;
}
