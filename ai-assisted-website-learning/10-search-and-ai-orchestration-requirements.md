# 10 — Job Discovery and AI Orchestration Requirements

## Purpose

Define the requirements for reliable job discovery and AI-assisted search orchestration. The application must search both the general web and the user's saved public sources, then return useful, traceable job opportunities.

## Problem statement

The current application can report zero verified jobs even when another browser-based AI assistant finds relevant openings. The primary gap is retrieval recall: candidates are filtered too early, too few searches are performed, and unavailable pages are treated as if no jobs exist.

OpenAI tool calling can improve orchestration, but the OpenAI SDK alone does not provide job-search coverage. A real search and extraction provider, such as the self-hosted Firecrawl service, must remain behind our server-side tool layer.

## Functional requirements

### Search inputs

- Combine the user's free-text query with selected countries, skills, work preferences, and visa-support preference.
- Search each selected country and relevant role independently where this improves recall.
- Preserve the user's saved search preferences as reusable defaults.
- Include user-saved public resources as additional sources, never as a replacement for general web search.
- Support a new search while preserving the current search conversation and search history.

### Discovery and retrieval

- Use multiple query variations for role, country, remote/on-site/hybrid work, and visa-support intent.
- Support pagination or cursor-based retrieval from the search provider.
- Search general web results through Firecrawl's search endpoint.
- Fetch and extract content from result pages and linked job-detail or application pages.
- Search saved public sources independently and merge their results with general web results.
- Support country-specific public job resources and company career pages.
- Retain the original result URL, source name, retrieval timestamp, and search query.
- Avoid rejecting a candidate solely because its URL does not match a known ATS pattern.

### Job extraction and normalization

- Detect whether a result is an actual job posting, a job-listing page, a search page, or unrelated content.
- Extract, when available:
  - job title
  - company
  - location and country
  - work mode
  - visa-support signals
  - description and requirements
  - application URL
  - source URL
  - publication or update date
- Parse `JobPosting` JSON-LD and other structured metadata before relying only on page text.
- Normalize equivalent fields across different sources.
- Deduplicate jobs by canonical URL and meaningful company/title/location similarity.
- Preserve evidence or source excerpts for important extracted fields.

### AI matching

- Use AI after retrieval to classify and rank candidates, not as a substitute for retrieval.
- Compare the confirmed candidate profile and resume with each normalized job description.
- Produce a match score from 0–100 with an explanation.
- Clearly separate verified facts, inferred attributes, and user-review-required values.
- Never invent qualifications, job facts, visa eligibility, or application links.
- Allow the user to review a result before using it to generate a resume or cover letter.

### User experience and observability

- Present search progress in the conversational workspace.
- Keep partial results when some sources fail.
- Display separate counts for discovered, fetched, extracted, verified, scored, unavailable, and rejected results.
- Explain failures such as browser verification, timeout, unsupported content, or invalid page format.
- Do not present “zero verified jobs” as “zero jobs” without diagnostic context.
- Allow users to open the original listing and application URL.
- Save the search query, selected filters, result set, status, and timestamp to search history.

## Required search pipeline

```text
User query + sidebar filters
        ↓
Query planner and query variations
        ↓
Parallel discovery
  ├─ General web search through Firecrawl
  ├─ User-saved public sources
  └─ Country-specific public resources
        ↓
Fetch pages and expand job/application links
        ↓
Extract and normalize job records
        ↓
Deduplicate and retain provenance
        ↓
AI validation, matching, and ranking
        ↓
Persist search and results
        ↓
Stream status and results to the chat workspace
```

Each candidate should move through these states:

```text
Discovered → Fetched → Extracted → Verified → Scored
```

Failure states must be retained rather than silently discarded:

```text
Unavailable | Browser verification | Timeout | Unsupported content | Rejected as non-job
```

## AI provider and SDK requirements

- Support OpenAI as one provider through the official `openai` npm package.
- Keep Ollama and other OpenAI-compatible endpoints supported through a provider adapter.
- Keep provider-specific differences out of search and job-domain logic.
- Prefer the OpenAI Responses API and custom tools for the OpenAI adapter.
- Use strict, validated JSON schemas for custom tool arguments and outputs.
- Validate every tool argument on the server before execution.
- Limit tool calls, execution time, result size, and network scope.
- Keep deterministic search orchestration on the server; use the model for intent interpretation, extraction, ranking, and explanation.

### Provider abstraction

```ts
interface AIProvider {
  generateText(input: string): Promise<string>;
  generateWithTools?(input: string, tools: unknown[]): Promise<unknown>;
  extractJob(content: string): Promise<unknown>;
  rankJobs(jobs: unknown[]): Promise<unknown>;
}
```

The provider adapter uses the official `openai` npm SDK with a configurable `baseURL`. This keeps native OpenAI, Ollama, and other compatible Chat Completions endpoints on one path while retaining a fallback for providers that do not implement tool calling.

## Initial custom tools

The first tool should provide one safe, user-visible job-search capability:

```text
search_jobs({
  query,
  countries,
  skills,
  workModes,
  visaSupport,
  includeSavedSources
})
```

The server-side implementation should internally coordinate Firecrawl, saved sources, normalization, deduplication, and diagnostics.

Later tools may include:

- `search_web`
- `search_saved_sources`
- `scrape_job_page`
- `extract_job_record`
- `match_resume_to_job`
- `save_job`
- `update_application`

Tools that create, modify, or submit external applications require explicit user confirmation and are outside this milestone.

## Non-functional requirements

- Search should be resilient to a single source or provider failure.
- Search execution must be bounded and observable.
- All external content must be treated as untrusted input.
- Prompt injection in job pages must not change server-side tool permissions.
- API keys and user data must remain server-side and encrypted where stored.
- Results must be reproducible enough to diagnose a search run.
- The design must work in Docker Compose with Firecrawl as an optional separate service.
- The feature must support local Ollama and hosted OpenAI-compatible endpoints.

## Implementation phases

### Phase 1 — Improve retrieval recall

- Relax restrictive URL and title pre-filters.
- Add query variations per country and role.
- Add pagination and larger, bounded candidate collection.
- Expand listing pages to individual job or application links.
- Parse JSON-LD `JobPosting` data.
- Merge and deduplicate general and saved-source results.
- Add candidate diagnostics and partial-result handling.

### Phase 2 — Add SDK-based orchestration

- Add the official OpenAI SDK as an optional provider adapter.
- Implement the validated `search_jobs` tool loop.
- Keep the existing compatible fetch adapter for Ollama and other endpoints.
- Add feature flags and tests for provider capability differences.

### Phase 3 — Matching and application assistance

- Match jobs against the confirmed resume and profile.
- Show explainable match scores.
- Generate job-specific resumes and cover letters from approved data.
- Generate interview questions and answers.
- Connect results to application tracking.

## Acceptance criteria

- A search with selected countries and skills searches general web sources even when no saved source exists.
- Saved public sources are searched in addition to general web search.
- A valid job is not rejected only because its URL is non-standard.
- The UI distinguishes discovered results from verified job postings.
- Partial results remain visible when some pages fail.
- Every displayed result has a source URL and retrieval timestamp.
- AI matching can be disabled without disabling basic job discovery.
- OpenAI, Ollama, and another OpenAI-compatible endpoint can be selected through the provider abstraction.
- No model can execute an unvalidated or unbounded server-side tool call.

## Status

Requirements recorded on 2026-08-27. Phase 1 retrieval work is now implemented:

- General Firecrawl discovery runs three bounded query variations in parallel.
- User-enabled saved public sources are scraped in addition to general discovery.
- Results are merged, deduplicated, capped, and passed through the existing AI validation/ranking layer when configured.
- Candidate filtering rejects common documentation/package/search noise, while structured `JobPosting` metadata is preferred when available.
- Saved-source failures do not discard general-web results.

The official `openai` npm SDK adapter is implemented. It uses the configured endpoint as `baseURL`, so OpenAI, Ollama, and other compatible providers share the same request path. The `/api/jobs/search` route now exposes a bounded server-side `search_jobs` tool: the model requests retrieval, while the server executes Firecrawl web search plus enabled user/admin saved public sources, deduplicates results, persists source jobs, and then performs optional AI ranking. Providers without tool-calling support fall back to the same retrieval path directly.
