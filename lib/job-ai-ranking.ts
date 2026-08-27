import type { ExtractedJob } from "@/lib/firecrawl-provider";
import { requestJsonCompletion, type OpenAiCompatibleCredentials } from "@/lib/openai-compatible-client";

export type RankedJob = ExtractedJob & {
  matchScore?: number;
  matchReasons?: string[];
  workMode?: "remote" | "hybrid" | "on-site" | "unknown";
  visaSupport?: "yes" | "no" | "unknown";
  aiVerified?: boolean;
};

type CandidateProfile = {
  headline?: string;
  location?: string;
  skills?: string;
  targetCountries?: string;
};

type AiJob = {
  url?: unknown;
  isJobPosting?: unknown;
  company?: unknown;
  role?: unknown;
  location?: unknown;
  workMode?: unknown;
  visaSupport?: unknown;
  matchScore?: unknown;
  matchReasons?: unknown;
};

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? value as T : fallback;
}

export async function validateAndRankJobs(input: {
  credentials: OpenAiCompatibleCredentials;
  query: string;
  profile: CandidateProfile;
  jobs: ExtractedJob[];
}): Promise<RankedJob[]> {
  if (!input.jobs.length) return [];
  const candidates = input.jobs.slice(0, 15).map((job) => ({
    url: job.url,
    title: job.title,
    company: job.company,
    location: job.location,
    remote: job.remote,
    description: job.description.slice(0, 700),
  }));

  const result = await requestJsonCompletion(input.credentials, [
    {
      role: "system",
      content: [
        "You validate and rank job-search results. Return JSON only.",
        "Use only supplied facts. Never invent a company, role, location, visa policy, score reason, or URL.",
        "Preserve every URL exactly. Mark isJobPosting false for category pages, search pages, articles, libraries, and documentation.",
        "Use unknown when work mode or visa support is not explicit.",
        "Return: {\"jobs\":[{\"url\":string,\"isJobPosting\":boolean,\"company\":string,\"role\":string,\"location\":string,\"workMode\":\"remote|hybrid|on-site|unknown\",\"visaSupport\":\"yes|no|unknown\",\"matchScore\":0-100,\"matchReasons\":[string]}]}.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({ query: input.query, candidateProfile: input.profile, candidates }),
    },
  ]) as { jobs?: unknown };

  if (!result || !Array.isArray(result.jobs)) throw new Error("The AI provider returned an invalid job list.");
  const originals = new Map(input.jobs.map((job) => [job.url, job]));
  const ranked: RankedJob[] = [];

  for (const raw of result.jobs as AiJob[]) {
    if (typeof raw.url !== "string" || raw.isJobPosting !== true) continue;
    const original = originals.get(raw.url);
    if (!original) continue;
    const numericScore = typeof raw.matchScore === "number" ? raw.matchScore : Number(raw.matchScore);
    const reasons = Array.isArray(raw.matchReasons)
      ? raw.matchReasons.filter((reason): reason is string => typeof reason === "string").map((reason) => reason.trim()).filter(Boolean).slice(0, 3)
      : [];
    ranked.push({
      ...original,
      company: typeof raw.company === "string" && raw.company.trim() ? raw.company.trim() : original.company,
      title: typeof raw.role === "string" && raw.role.trim() ? raw.role.trim() : original.title,
      location: typeof raw.location === "string" && raw.location.trim() ? raw.location.trim() : original.location,
      workMode: enumValue(raw.workMode, ["remote", "hybrid", "on-site", "unknown"] as const, original.remote ? "remote" : "unknown"),
      visaSupport: enumValue(raw.visaSupport, ["yes", "no", "unknown"] as const, "unknown"),
      matchScore: Number.isFinite(numericScore) ? Math.max(0, Math.min(100, Math.round(numericScore))) : 0,
      matchReasons: reasons,
      aiVerified: true,
    });
  }

  return ranked.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
}
