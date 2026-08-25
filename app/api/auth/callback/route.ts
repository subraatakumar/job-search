import { NextRequest, NextResponse } from "next/server";
import { authConfig, authEndpoints } from "@/lib/auth-config";
import { createSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.cookies.get("jobsearch_oauth_state")?.value;
  const verifier = request.cookies.get("jobsearch_oauth_verifier")?.value;
  if (!code || !state || state !== expectedState || !verifier) return NextResponse.json({ error: "Invalid OAuth callback" }, { status: 400 });

  const tokenResponse = await fetch(authEndpoints.token, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", client_id: authConfig.clientId, code, redirect_uri: authConfig.redirectUri, code_verifier: verifier }),
  });
  if (!tokenResponse.ok) return NextResponse.json({ error: "Token exchange failed" }, { status: 502 });
  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!token.access_token) return NextResponse.json({ error: "No access token returned" }, { status: 502 });

  const userResponse = await fetch(authEndpoints.userinfo, { headers: { authorization: `Bearer ${token.access_token}` } });
  if (!userResponse.ok) return NextResponse.json({ error: "User information request failed" }, { status: 502 });
  const user = (await userResponse.json()) as { sub?: string; email?: string; name?: string };
  if (!user.sub) return NextResponse.json({ error: "Invalid user information" }, { status: 502 });

  const publicAppUrl = process.env.APP_URL ?? "http://localhost:3020";
  const response = NextResponse.redirect(new URL("/dashboard", publicAppUrl));
  response.cookies.delete("jobsearch_oauth_state");
  response.cookies.delete("jobsearch_oauth_verifier");
  const session = createSession({ id: user.sub, email: user.email, name: user.name });
  response.cookies.set(session.name, session.value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60, path: "/" });
  return response;
}
