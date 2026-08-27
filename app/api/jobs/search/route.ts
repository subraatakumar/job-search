import { headers } from "next/headers";
import { readSession } from "@/lib/session";
import { isFirecrawlConfigured, searchWeb } from "@/lib/firecrawl-provider";
import { getAiProviderCredentials } from "@/lib/ai-provider-repository";
import { validateAndRankJobs } from "@/lib/job-ai-ranking";
import { getProfile } from "@/lib/profile-repository";

export async function POST(request: Request) {
  const session = readSession(new Request("http://localhost", { headers: await headers() }));
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isFirecrawlConfigured()) return Response.json({ error: "Firecrawl is not configured." }, { status: 503 });
  const body = await request.json() as { query?: unknown };
  if (typeof body.query !== "string" || !body.query.trim()) return Response.json({ error: "A search query is required." }, { status: 400 });
  try {
    const query = body.query.trim();
    const jobs = await searchWeb(query);
    const [credentials, profile] = await Promise.all([
      getAiProviderCredentials(session.id),
      getProfile(session.id),
    ]);
    if (!credentials || !jobs.length) return Response.json({ jobs, aiEnhanced: false });

    try {
      const ranked = await validateAndRankJobs({
        credentials,
        query,
        profile: {
          headline: profile?.headline,
          location: profile?.location,
          skills: profile?.skills,
          targetCountries: profile?.target_countries,
        },
        jobs,
      });
      return Response.json({
        jobs: ranked.length ? ranked : jobs,
        aiEnhanced: ranked.length > 0,
        aiWarning: ranked.length ? undefined : "AI validation returned no usable jobs; showing Firecrawl-verified results.",
      });
    } catch (error) {
      return Response.json({
        jobs,
        aiEnhanced: false,
        aiWarning: error instanceof Error ? error.message : "AI ranking was unavailable.",
      });
    }
  }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Search failed." }, { status: 502 }); }
}
