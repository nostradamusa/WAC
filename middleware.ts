import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 1. Enforce First-Time Welcome Routing at the Edge
  if (request.nextUrl.pathname === "/") {
    const hasSeenWelcome = request.cookies.has("wac_welcome_seen");
    if (!hasSeenWelcome) {
      return NextResponse.redirect(new URL("/welcome", request.url));
    }
  }
  const isDev = process.env.NODE_ENV === "development";

  // Build the CSP directives.
  //
  // script-src notes:
  //   'unsafe-inline'  — required by Next.js inline bootstrap scripts and
  //                      Google Translate's injected init script.
  //   'unsafe-eval'    — required by Next.js HMR in dev only; omitted in prod.
  //   translate.google.com (no scheme) — covers both http:// and https://;
  //   Google Translate's loader uses http:// which https://-only would block.
  //   https://*.gstatic.com — covers fonts/icons loaded by Translate widget.
  //
  // connect-src notes:
  //   wss://*.supabase.co — Supabase Realtime WebSocket.

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    "translate.google.com",
    "http://www.google.com",
    "https://www.google.com",
    "https://translate.googleapis.com",
    "https://translate-pa.googleapis.com",
    "https://*.gstatic.com",
  ]
    .filter(Boolean)
    .join(" ");

  const csp = [
    `default-src 'self' ${isDev ? "'unsafe-eval'" : ""}`,
    `script-src ${scriptSrc}`,
    `script-src-elem 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} translate.google.com http://www.google.com https://www.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://*.gstatic.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://translate.googleapis.com https://translate.google.com translate.google.com https://*.gstatic.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://translate.googleapis.com https://translate.google.com translate.google.com https://*.gstatic.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http://translate.google.com",
    "media-src 'self' blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://translate.googleapis.com https://translate-pa.googleapis.com https://translate.google.com",
    "frame-src 'self' https://translate.googleapis.com translate.googleapis.com https://*.google.com",
  ].join("; ");

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
