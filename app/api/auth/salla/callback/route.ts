import { NextRequest, NextResponse } from "next/server";

/**
 * Salla OAuth callback.
 *
 * Salla redirects merchants here after they authorize the app.
 * Query params: ?code=xxx&state=yyy
 *
 * Flow:
 *  1. Validate code present
 *  2. POST to backend /salla/oauth/exchange → backend exchanges for tokens, fetches store info, upserts merchant
 *  3. Redirect to /dashboard?installed=<merchantId>
 *
 * On failure: redirect to /?install_error=<details> instead of returning JSON
 * so the user lands on a real page they can read.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const sallaError = searchParams.get("error");

  // Salla rejected the install (user denied or scope error)
  if (sallaError) {
    return redirectWithError(
      req,
      `salla_${sallaError}`,
      searchParams.get("error_description") ?? undefined
    );
  }

  if (!code) {
    return redirectWithError(req, "missing_code");
  }

  const backendUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8080";

  try {
    const exchange = await fetch(`${backendUrl}/salla/oauth/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
    });

    const responseText = await exchange.text();
    let data: { ok?: boolean; merchant?: { id?: string }; detail?: string } | null = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      // not JSON — keep raw text for the error message
    }

    if (!exchange.ok) {
      console.error("[salla/callback] backend exchange failed", {
        status: exchange.status,
        body: responseText.slice(0, 500),
      });
      return redirectWithError(
        req,
        `exchange_failed_${exchange.status}`,
        data?.detail ?? responseText.slice(0, 200)
      );
    }

    const merchantId = data?.merchant?.id;
    const url = new URL("/dashboard", req.url);
    if (merchantId) url.searchParams.set("installed", merchantId);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("[salla/callback] fetch threw", err);
    return redirectWithError(
      req,
      "backend_unreachable",
      String(err instanceof Error ? err.message : err)
    );
  }
}

function redirectWithError(req: NextRequest, code: string, detail?: string) {
  const url = new URL("/", req.url);
  url.searchParams.set("install_error", code);
  if (detail) url.searchParams.set("install_error_detail", detail.slice(0, 300));
  return NextResponse.redirect(url);
}
