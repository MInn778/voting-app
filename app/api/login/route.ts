import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  isOperatorPassword,
  sessionCookieOptions,
} from "@/lib/operator-session";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");

  if (!isOperatorPassword(password)) {
    return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/operator", request.url), 303);
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions);
  return response;
}
