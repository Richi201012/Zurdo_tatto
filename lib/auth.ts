import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminRole } from "@/lib/booking/statuses";

const COOKIE_NAME = "studio_admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

function credentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? "",
    password: process.env.ADMIN_PASSWORD ?? "",
    secret: process.env.ADMIN_SESSION_SECRET ?? "",
  };
}

export function isAdminConfigured() {
  const value = credentials();
  return Boolean(value.email && value.password && value.secret.length >= 24);
}

function sign(payload: string) {
  return createHmac("sha256", credentials().secret).update(payload).digest("base64url");
}

export function createAdminSession() {
  const configured = credentials();
  const payload = Buffer.from(JSON.stringify({ role: "ADMIN", email: configured.email, name: "Administrador", exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyCredentials(email: string, password: string) {
  const configured = credentials();
  if (!isAdminConfigured()) return false;
  const digest = (value: string) => createHmac("sha256", configured.secret).update(value).digest();
  const emailMatch = timingSafeEqual(digest(email), digest(configured.email));
  const passwordMatch = timingSafeEqual(digest(password), digest(configured.password));
  return emailMatch && passwordMatch;
}

export interface AdminSession { role: AdminRole; email: string; name: string; exp: number }

export function getAdminSession(token?: string): AdminSession | null {
  if (!token || !isAdminConfigured()) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role?: string; email?: string; name?: string; exp?: number };
    const normalizedRole = data.role === "admin" ? "ADMIN" : data.role;
    if (!data.exp || data.exp <= Date.now() / 1000 || !["ADMIN", "ARTIST", "RECEPTION"].includes(normalizedRole ?? "")) return null;
    return { role: normalizedRole as AdminRole, email: data.email ?? credentials().email, name: data.name ?? "Administrador", exp: data.exp };
  } catch {
    return null;
  }
}

export function verifyAdminSession(token?: string) { return Boolean(getAdminSession(token)); }

export async function isAdminRequest() {
  return verifyAdminSession((await cookies()).get(COOKIE_NAME)?.value);
}

export async function currentAdmin() {
  return getAdminSession((await cookies()).get(COOKIE_NAME)?.value);
}

export async function requireAdmin() {
  const session = await currentAdmin();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireRole(allowed: AdminRole[]) {
  const session = await requireAdmin();
  if (!allowed.includes(session.role)) redirect("/admin");
  return session;
}

export async function authorizeApi(allowed: AdminRole[] = ["ADMIN", "ARTIST", "RECEPTION"]) {
  const session = await currentAdmin();
  return session && allowed.includes(session.role) ? session : null;
}

export async function authorizeMutation(request: Request, allowed: AdminRole[] = ["ADMIN", "ARTIST", "RECEPTION"]) {
  const origin = request.headers.get("origin");
  if (origin) {
    const allowedOrigins = new Set([new URL(request.url).origin]);
    for (const configuredUrl of [process.env.APP_URL, process.env.NEXT_PUBLIC_SITE_URL, process.env.PUBLIC_SITE_URL]) {
      if (!configuredUrl) continue;
      try { allowedOrigins.add(new URL(configuredUrl).origin); } catch { /* La configuración inválida no autoriza orígenes. */ }
    }
    let requestOrigin = "";
    try { requestOrigin = new URL(origin).origin; } catch { return null; }
    if (!allowedOrigins.has(requestOrigin)) return null;
  }
  return authorizeApi(allowed);
}

export const adminCookie = { name: COOKIE_NAME, maxAge: SESSION_SECONDS };
