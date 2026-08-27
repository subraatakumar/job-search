# 09 — Job-source integration design

## Goal

Allow users to combine general job discovery with saved public company career pages and permitted integrations.

## Search and extraction provider decision

Search discovery and page extraction are separate responsibilities. JobSearch will keep them behind a provider interface so the product is not coupled to one vendor or scraping implementation.

- **OpenSERP:** planned for anonymous general discovery through Google, Bing, DuckDuckGo, and other supported engines. It is lightweight, Docker-friendly, and MIT licensed.
- **Firecrawl:** planned for public sources whose listings are JavaScript-rendered or require browser execution. It can scrape, crawl, interact with pages, and return Markdown or structured data. It will run as a separate Docker Compose project during validation, with the API normally available at `http://localhost:3002`.

The first Firecrawl integration should call the self-hosted API from a server-side adapter and normalize its output into the existing `jobs` model. The current direct HTTP parser remains a fallback for simple HTML pages. Firecrawl is not initially part of the main JobSearch Compose file because its browser, queue, and database services have a larger resource footprint.

```text
general discovery  -> OpenSERP adapter (planned)
saved public URL   -> direct parser -> Firecrawl adapter when needed
normalized output  -> jobs table -> matching and application workflow
```

## Source categories

### Public sources

Users may save public HTTPS career-page URLs. The system may fetch permitted pages on a schedule, parse listings, normalize job records, and retain the source URL for attribution.

The fetcher must respect applicable terms, `robots.txt`, rate limits, request timeouts, and response-size limits.

### Gated sources

JobSearch must not collect platform passwords, session cookies, browser-cookie exports, or login credentials. It must not bypass access controls or automate sites where the platform prohibits scraping or automation.

Supported alternatives are official APIs/partner integrations, user-pasted job URLs, user-uploaded job descriptions, and user-controlled manual import flows.

## Proposed data model

```text
job_sources
- id
- user_id
- name
- source_type: public_url | official_api | manual_url
- base_url
- enabled
- last_checked_at
- check_frequency

jobs
- id
- source_id
- title
- company
- location
- description
- source_url
- visa_signal
- published_at
- content_hash
- last_seen_at
```

## Required security controls

- Accept only HTTPS URLs.
- Block localhost, private IP ranges, link-local addresses, and internal hostnames to prevent SSRF.
- Validate every redirect destination.
- Enforce connection, total-request, and response-size limits.
- Sanitize extracted HTML before display.
- Rate-limit each source and user.
- Deduplicate using canonical URLs and content hashes.
- Keep source attribution and retrieval timestamps.
- Search runs retain candidate provenance, verification outcomes, application links, canonical URLs, and source-level failures. Firecrawl requests use bounded retries and freshness-limited discovery; failed candidates are diagnostic data and are never displayed as verified jobs.
- Provide deletion and disable controls for user-created sources.

## MVP scope

1. Public company career pages, using direct parsing first and Firecrawl for dynamic pages.
2. Official job APIs and feeds.
3. User-pasted job URLs.
4. User-uploaded job descriptions.
5. No automated login to gated platforms.

## Product decision

The product prioritizes user safety, platform compliance, and transparent source attribution over broad but unauthorized scraping coverage. Any future platform connector requires explicit API or partner authorization and a separate terms/privacy review.

## Self-hosting notes

Both tools can be self-hosted with Docker. OpenSERP is normally a small single-service deployment. Firecrawl provides an official Compose setup and public container images, but its stack includes API, Playwright, Redis, RabbitMQ, and PostgreSQL/NuQ services. Self-hosting removes hosted-service request billing; operators still provide the required compute, storage, bandwidth, upgrades, and monitoring. Review the pinned Firecrawl release and its Compose configuration before use.
