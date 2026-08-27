import { createHmac, timingSafeEqual } from "node:crypto";

const cookieName = "jobsearch_session";
// Authentication is enabled by default. Set LOGIN_REQUIRED=false for local
// development to use a stable local identity without contacting the auth host.
export function loginRequired() { return process.env.LOGIN_REQUIRED !== "false"; }
const secret = process.env.SESSION_SECRET ?? (process.env.NODE_ENV === "production" ? (() => { throw new Error("SESSION_SECRET is required in production"); })() : "local-development-session-secret");

function sign(value: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSession(user: { id: string; email?: string; name?: string }) {
  const value = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64url");
  return { name: cookieName, value: `${value}.${sign(value)}` };
}

export function readSession(request: Request) {
  if (!loginRequired()) return { id: "local-development-user", email: "dev@localhost", name: "Local Developer", exp: Date.now() + 365 * 24 * 60 * 60 * 1000 };
  const raw = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (!raw) return null;
  const [value, signature] = raw.split(".");
  if (!value || !signature) return null;
  const expected = sign(value);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const session = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { exp: number; id: string; email?: string; name?: string };
  return session.exp > Date.now() ? session : null;
}

export const sessionCookieName = cookieName;
