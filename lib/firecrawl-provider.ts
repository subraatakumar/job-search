type SearchResult = { url?: string; title?: string; description?: string; markdown?: string };

export type ExtractedJob = {
  title: string; url: string; company: string; location: string;
  description: string; remote: boolean; source: string;
};

function clean(value: string) { return value.replace(/\s+/g, " ").replace(/^[-–—|:]+|[-–—|:]+$/g, "").trim() }
function hostname(url: string) { try { return new URL(url).hostname.replace(/^www\./, "") } catch { return "Web search" } }
function firecrawlUrl() { return process.env.FIRECRAWL_URL?.replace(/\/$/, "") }
function requestHeaders() { return { "content-type": "application/json", ...(process.env.FIRECRAWL_API_KEY ? { authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` } : {}) } }
function challenge(text: string) { return /verifying your browser|incident id|radware page|captcha|access denied/i.test(text) }

function isIndividualJobUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const path = url.pathname.toLowerCase().replace(/\/$/, "");
    const host = url.hostname.toLowerCase();
    if (/\/(search|job-search|jobs-search|job-listings|vacancies|open-positions)$/.test(path)) return false;
    if (/\/(jobs|careers|career|employment)$/.test(path)) return false;
    if (/indeed\.|linkedin\.|glassdoor\.|arc\.dev|naukri\.|reactjobs\.io|reactnative-jobs\./.test(host)) {
      return /\/viewjob|\/jobs\/view|\/job\/[^/]+|\/jobs\/[^/]+\/[^/]+/.test(path);
    }
    return /\/job[s]?\/[^/?#]{4,}|\/position[s]?\/[^/?#]{4,}|\/vacanc(?:y|ies)\/[^/?#]{4,}/.test(path) ||
      /greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com|smartrecruiters\.com/.test(host);
  } catch { return false }
}

function likelyJobTitle(title: string) {
  return /engineer|developer|designer|manager|analyst|architect|consultant|specialist|lead|director|intern|administrator|scientist|programmer|mobile|frontend|backend|full.?stack|react native/i.test(title);
}
function heading(markdown: string) { return clean(markdown.match(/^#{1,2}\s+(.+)$/m)?.[1] ?? "") }
function field(markdown: string, label: string) {
  return clean(markdown.match(new RegExp(`(?:\\*\\*|^|\\n)${label}(?:\\*\\*)?\\s*[:|-]\\s*([^\\n]{2,120})`, "i"))?.[1] ?? "");
}
function companyFromTitle(title: string, fallback: string) {
  const parts = title.split(/\s(?:\|| at | @ | - | – | —)\s/i).map(clean).filter(Boolean);
  return parts.length > 1 ? (parts.at(-1) ?? fallback) : fallback;
}

async function scrapeCandidate(candidate: SearchResult): Promise<ExtractedJob | null> {
  const base = firecrawlUrl();
  if (!base || !candidate.url) return null;
  try {
    const response = await fetch(`${base}/v2/scrape`, { method: "POST", headers: requestHeaders(), body: JSON.stringify({ url: candidate.url, formats: ["markdown"] }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) return null;
    const payload = await response.json() as { success?: boolean; data?: { markdown?: string; metadata?: Record<string, unknown> } };
    const markdown = payload.data?.markdown ?? "";
    if (!payload.success || !markdown || challenge(markdown)) return null;
    const metadata = payload.data?.metadata ?? {};
    const metadataTitle = typeof metadata.title === "string" ? metadata.title : "";
    const title = clean(heading(markdown) || metadataTitle || candidate.title || "");
    if (!likelyJobTitle(title)) return null;
    const company = clean(field(markdown, "Company") || (typeof metadata.author === "string" ? metadata.author : "") || companyFromTitle(title, hostname(candidate.url)));
    const location = clean(field(markdown, "Location") || field(markdown, "Work location"));
    // Preserve the search snippet, but also include actual scraped page content so
    // downstream AI validation has enough evidence to classify and rank the role.
    const description = clean(`${candidate.description ?? ""} ${markdown.slice(0, 1400)}`);
    const remote = /\bremote\b/i.test(`${title} ${location} ${description} ${markdown.slice(0, 3000)}`);
    return { title, url: candidate.url, company, location: location || (remote ? "Remote" : "Not specified"), description, remote, source: hostname(candidate.url) };
  } catch { return null }
}

export function isFirecrawlConfigured() { return Boolean(firecrawlUrl()) }

export async function searchWeb(query: string): Promise<ExtractedJob[]> {
  const base = firecrawlUrl();
  if (!base) throw new Error("Firecrawl is not configured.");
  const response = await fetch(`${base}/v2/search`, { method: "POST", headers: requestHeaders(), body: JSON.stringify({ query: `${query} (job OR vacancy OR hiring) (apply OR \"job details\")`, limit: 40 }), signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Firecrawl returned HTTP ${response.status}.`);
  const payload = await response.json() as { data?: { web?: SearchResult[] } };
  const candidates = (payload.data?.web ?? []).filter(item => item.url && item.title)
    .filter(item => isIndividualJobUrl(item.url ?? "") && likelyJobTitle(item.title ?? ""))
    .filter(item => !/(npmjs|github\.com|stackoverflow|w3schools|country-picker)/i.test(`${item.title} ${item.url}`)).slice(0, 15);
  const settled = await Promise.allSettled(candidates.map(scrapeCandidate));
  const jobs = settled.filter((result): result is PromiseFulfilledResult<ExtractedJob | null> => result.status === "fulfilled")
    .map(result => result.value).filter((job): job is ExtractedJob => Boolean(job));
  const unique = new Map<string, ExtractedJob>();
  for (const job of jobs) { const key = `${job.company}|${job.title}|${job.location}`.toLowerCase(); if (!unique.has(key)) unique.set(key, job) }
  return Array.from(unique.values()).slice(0, 20);
}

export async function scrapePublicSource(source: { name: string; base_url: string }): Promise<ExtractedJob[]> {
  const base = firecrawlUrl();
  if (!base) throw new Error("Firecrawl is not configured.");
  const response = await fetch(`${base}/v2/scrape`, { method: "POST", headers: requestHeaders(), body: JSON.stringify({ url: source.base_url, formats: ["markdown"] }), signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Firecrawl returned HTTP ${response.status}.`);
  const payload = await response.json() as { success?: boolean; data?: { markdown?: string } };
  const markdown = payload.data?.markdown ?? "";
  if (!payload.success || !markdown) throw new Error("Firecrawl returned no page content.");
  if (challenge(markdown)) throw new Error("The source returned a browser-verification page.");
  const links: SearchResult[] = [];
  const pattern = /\[([^\]]{4,160})\]\((https?:\/\/[^)]+)\)/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(markdown)) && links.length < 40) {
    const title = clean(match[1]); const url = match[2].replace(/[),.]+$/g, "");
    if (isIndividualJobUrl(url) && likelyJobTitle(title)) links.push({ title, url, description: title });
  }
  const settled = await Promise.allSettled(links.slice(0, 15).map(scrapeCandidate));
  return settled.filter((result): result is PromiseFulfilledResult<ExtractedJob | null> => result.status === "fulfilled")
    .map(result => result.value).filter((job): job is ExtractedJob => Boolean(job));
}
