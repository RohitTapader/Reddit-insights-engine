import { NextResponse } from "next/server";

/**
 * Register this path as the Reddit app "redirect uri":
 *
 * Production:  https://<your-vercel-domain>/auth/reddit/callback
 * Local dev:   http://localhost:3000/auth/reddit/callback
 *
 * Required when creating a "web app" on reddit.com/prefs/apps even if you only
 * use application-only OAuth (client_credentials); Reddit still asks for a redirect URL.
 *
 * User login (authorization code) is not implemented yet — this route only validates
 * that the registered URL exists. If you add user OAuth later, exchange `code` here.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const err = url.searchParams.get("error");
  const desc = url.searchParams.get("error_description");

  if (err) {
    const msg = desc ? `${err}: ${desc}` : err;
    return new NextResponse(
      `<!DOCTYPE html><html><body><p>Reddit OAuth error: ${escapeHtml(msg)}</p></body></html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new NextResponse(
    `<!DOCTYPE html><html><head><title>Reddit</title></head><body>
      <p>Reddit redirect URI is configured correctly.</p>
      <p>For search in this app you can use <strong>application-only</strong> OAuth (client id + secret in env) without visiting this page.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
