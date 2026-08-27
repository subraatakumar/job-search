import { headers } from "next/headers";
import { readSession } from "@/lib/session";
import { isFirecrawlConfigured, searchWebDetailed, scrapePublicSource, type ExtractedJob } from "@/lib/firecrawl-provider";
import { getAiProviderCredentials } from "@/lib/ai-provider-repository";
import { getJobSources, saveJobs, recordSearch } from "@/lib/job-source-repository";
import { validateAndRankJobs } from "@/lib/job-ai-ranking";
import { getProfile } from "@/lib/profile-repository";
import { requestJsonWithTools } from "@/lib/openai-compatible-client";

const searchJobsTool = {
  type: "function" as const,
  function: {
    name: "search_jobs",
    description: "Search the web and the user's saved public job sources for relevant job openings.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "The user's job search request." } },
      required: ["query"],
      additionalProperties: false,
    },
  },
};
function jobKey(job: ExtractedJob) {
  try {
    const url = new URL(job.url);
    url.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"].forEach((key) => url.searchParams.delete(key));
    return `url:${url.toString().replace(/\/$/, "").toLowerCase()}`;
  } catch {
    return `text:${job.company}|${job.title}|${job.location}`.toLowerCase().replace(/\s+/g, " ");
  }
}

export async function POST(request: Request) {
  const session = readSession(new Request("http://localhost", { headers: await headers() }));
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isFirecrawlConfigured()) return Response.json({ error: "Firecrawl is not configured." }, { status: 503 });
  const body = await request.json() as { query?: unknown };
  if (typeof body.query !== "string" || !body.query.trim()) return Response.json({ error: "A search query is required." }, { status: 400 });
  try {
    const query = body.query.trim();
    const sources = (await getJobSources(session.id)).filter((source) => source.enabled);
    const [credentials, profile] = await Promise.all([
      getAiProviderCredentials(session.id),
      getProfile(session.id),
    ]);
    let searchedJobs: ExtractedJob[] = [];
    let savedJobCount = 0;
    let toolRetrieved = false;
    let firecrawlDiagnostics = { requests: 0, rawResults: 0, candidateUrls: 0, pagesFetched: 0, verifiedJobs: 0, rejectedPages: 0, failedRequests: 0, errors: [] as string[] };
    const retrieveJobs = async (requestedQuery: string) => {
      const [webJobs, savedSourceResults] = await Promise.all([
        searchWebDetailed(requestedQuery),
        Promise.allSettled(sources.map(async (source) => {
          const jobs = (await scrapePublicSource(source)).map((job) => ({ ...job, sourceName: source.name, sourceType: source.source_type }));
          if (source.id && jobs.length) await saveJobs(session.id, source.id, jobs);
          return jobs;
        })),
      ]);
      const savedJobs = savedSourceResults.flatMap((result) => result.status === "fulfilled" ? result.value : []);
      firecrawlDiagnostics = webJobs.diagnostics;
      savedJobCount += savedJobs.length;
      searchedJobs = [...searchedJobs, ...webJobs.jobs, ...savedJobs];
      return { count: webJobs.jobs.length + savedJobs.length, jobs: [...webJobs.jobs, ...savedJobs], diagnostics: webJobs.diagnostics };
    };

    if (credentials) {
      // Some OpenAI-compatible local models expose chat completions but not
      // tool calling. Keep search useful for those providers by falling back
      // to the same server-side retrieval path once.
      try {
        await requestJsonWithTools(
          credentials,
          [
            { role: "system", content: "You are a job search orchestrator. Always call search_jobs before responding. After the tool returns, respond with JSON: {\"searched\":true}." },
            { role: "user", content: query },
          ],
          [searchJobsTool],
          async (name, argumentsJson) => {
            if (name !== "search_jobs") throw new Error(`Unsupported tool: ${name}`);
            let args: { query?: unknown };
            try { args = JSON.parse(argumentsJson) as { query?: unknown }; } catch { throw new Error("The AI provider returned invalid tool arguments."); }
            toolRetrieved = true;
            return retrieveJobs(typeof args.query === "string" && args.query.trim() ? args.query.trim() : query);
          },
        );
      } catch (error) {
        if (!toolRetrieved) await retrieveJobs(query);
      }
    } else {
      await retrieveJobs(query);
    }

    const unique = new Map<string, ExtractedJob>();
    for (const job of searchedJobs) {
      const key = jobKey(job);
      if (!unique.has(key)) unique.set(key, job);
    }
    const jobs = Array.from(unique.values()).slice(0, 40);
    const diagnostics = { discovered: firecrawlDiagnostics.rawResults, extracted: jobs.length, verified: jobs.length, scored: 0, savedSources: sources.length, firecrawl: firecrawlDiagnostics };
    if (!credentials || !jobs.length) { await recordSearch(session.id, query, jobs.length); return Response.json({ jobs, aiEnhanced: false, sourcesSearched: sources.length, savedJobCount, diagnostics }); }

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
      await recordSearch(session.id, query, ranked.length || jobs.length);
      return Response.json({
        jobs: ranked.length ? ranked : jobs,
        aiEnhanced: ranked.length > 0,
        aiWarning: ranked.length ? undefined : "AI validation returned no usable jobs; showing Firecrawl-verified results.",
        sourcesSearched: sources.length,
        savedJobCount,
        diagnostics: { ...diagnostics, scored: ranked.length },
      });
    } catch (error) {
      await recordSearch(session.id, query, jobs.length);
      return Response.json({
        jobs,
        aiEnhanced: false,
        aiWarning: error instanceof Error ? error.message : "AI ranking was unavailable.",
        sourcesSearched: sources.length,
        savedJobCount,
        diagnostics,
      });
    }
  }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Search failed." }, { status: 502 }); }
}
