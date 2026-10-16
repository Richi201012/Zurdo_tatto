import { NextResponse } from "next/server";
import { adminCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.set(adminCookie.name, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
