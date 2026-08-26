import { headers } from "next/headers";
import { readSession } from "@/lib/session";
import { getSearchPreferences, saveSearchPreferences } from "@/lib/search-preferences-repository";

async function userId() {
  const session = readSession(new Request("http://localhost", { headers: await headers() }));
  return session?.id;
}

export async function GET() {
  const id = await userId();
  if (!id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await getSearchPreferences(id));
}

export async function POST(request: Request) {
  const id = await userId();
  if (!id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!Array.isArray(body.preferences) || body.preferences.length === 0 || body.preferences.some((item: any) => typeof item.country !== "string" || !item.country.trim() || typeof item.roles !== "string" || !item.roles.trim())) return Response.json({ error: "Each search needs a country and at least one role." }, { status: 400 });
  const saved = await saveSearchPreferences(id, body.preferences.map((item: any) => ({ country: item.country.trim(), roles: item.roles.trim(), sponsorshipRequired: item.sponsorshipRequired !== false, frequency: item.frequency || "daily" })));
  return Response.json(saved);
}
