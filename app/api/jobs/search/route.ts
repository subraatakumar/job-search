import { headers } from "next/headers";
import { readSession } from "@/lib/session";
import { isFirecrawlConfigured, searchWeb } from "@/lib/firecrawl-provider";

export async function POST(request: Request) {
  const session = readSession(new Request("http://localhost", { headers: await headers() }));
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isFirecrawlConfigured()) return Response.json({ error: "Firecrawl is not configured." }, { status: 503 });
  const body = await request.json() as { query?: unknown };
  if (typeof body.query !== "string" || !body.query.trim()) return Response.json({ error: "A search query is required." }, { status: 400 });
  try { return Response.json({ jobs: await searchWeb(body.query.trim()) }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Search failed." }, { status: 502 }); }
}
