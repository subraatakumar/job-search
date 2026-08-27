import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { authConfig, authEndpoints } from "@/lib/auth-config";
import { loginRequired } from "@/lib/session";

export function GET(request: Request) {
  if (!loginRequired()) return NextResponse.redirect(new URL("/dashboard", request.url));
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const url = new URL(authEndpoints.authorize);
  url.search = new URLSearchParams({
    client_id: authConfig.clientId,
    redirect_uri: authConfig.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set("jobsearch_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  response.cookies.set("jobsearch_oauth_verifier", verifier, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  return response;
}
