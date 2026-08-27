import { headers } from "next/headers";
import { readSession } from "@/lib/session";
import { saveUserJob } from "@/lib/job-source-repository";

export async function POST(request: Request) {
  const session = readSession(new Request("http://localhost", { headers: await headers() }));
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const required = ["title", "company", "location", "sourceUrl"];
  if (required.some((key) => typeof body[key] !== "string" || !(body[key] as string).trim())) return Response.json({ error: "Incomplete job record." }, { status: 400 });
  try { return Response.json(await saveUserJob(session.id, { title: body.title as string, company: body.company as string, location: body.location as string, description: typeof body.description === "string" ? body.description : "", sourceUrl: body.sourceUrl as string, applyUrl: typeof body.applyUrl === "string" ? body.applyUrl : undefined, sourceName: typeof body.sourceName === "string" ? body.sourceName : undefined })); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not save job." }, { status: 500 }); }
}
