import { NextRequest, NextResponse } from "next/server";

/**
 * Salla OAuth callback.
 *
 * Salla redirects merchants here after they authorize the app.
 * Query params: ?code=xxx&state=yyy
 *
 * Flow:
 *  1. Validate `state` against session
 *  2. POST to backend with `code` -> backend exchanges for access_token
 *  3. Backend persists merchant + tokens
 *  4. Redirect merchant to /dashboard
 *
 * STUB: implementation deferred until backend OAuth handler is live.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";
  const exchange = await fetch(`${backendUrl}/salla/oauth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, state }),
  });

  if (!exchange.ok) {
    return NextResponse.json(
      { error: "exchange_failed" },
      { status: exchange.status }
    );
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
