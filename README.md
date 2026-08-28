# JobSearch

![JobSearch — AI-assisted international job search](docs/images/jobsearch-hero.png)

AI-assisted international job search and application preparation.

## Project status

Early open-source MVP. Authentication, Docker workflow, profile onboarding, multi-country search preferences, encrypted AI-provider configuration, public source management, and an initial source refresh flow are working. Dynamic-source extraction and resume-to-job matching are the next milestones.

## Our intention and roadmap

JobSearch is intended to be a privacy-conscious, AI-assisted workspace for discovering international jobs, understanding how well they match a candidate’s profile, and preparing stronger applications. The product should keep the candidate in control: it should use public job information, explain its recommendations, protect sensitive configuration, and never require credentials or cookies for gated platforms.

The table below is the current product checklist. A checked item is implemented in this repository; an unchecked item is an invitation to help shape and build the next version.

| Feature or product goal | Status | Notes |
| --- | :---: | --- |
| OAuth authentication with secure sessions | ✅ | Subra Auth with OAuth and PKCE |
| Local development mode without external login | ✅ | Set `LOGIN_REQUIRED=false` |
| Profile onboarding and resume PDF text extraction | ✅ | Review-first profile workflow |
| Multi-country job-search preferences | ✅ | Roles, sponsorship, and frequency per country |
| Configurable hosted or local AI provider | ✅ | OpenAI-compatible providers, including Ollama |
| Encrypted server-side API-key storage | ✅ | AES-256-GCM; keys are not returned to the browser |
| Public job-source management | ✅ | User and admin catalog workflows |
| Initial job-source refresh and normalization | ✅ | Public source pages only |
| AI-assisted web job search and ranking | ✅ | Server-side search orchestration and optional AI scoring |
| Search history and saved-job workflow | 🟡 | Core pieces exist; richer persistence and UX remain |
| Reliable JavaScript-heavy source extraction | ☐ | Continue Firecrawl integration and validation |
| General web discovery through OpenSERP | ☐ | Planned provider in the search architecture |
| Resume-to-job matching with transparent explanations | ☐ | Planned milestone |
| Tailored application and cover-letter preparation | ☐ | Planned milestone |
| Interview preparation based on a selected job | ☐ | Planned milestone |
| Notifications, scheduled searches, and digests | ☐ | Proposed future feature |
| Broader automated tests and evaluation datasets | ☐ | Contributions welcome |

## Features

- Central authentication through Subra Auth using OAuth and PKCE
- Dockerized local development
- PostgreSQL-backed application foundation
- Text-based PDF resume extraction
- Review-first profile workflow
- Searchable multi-country preferences with per-country schedules
- OpenAI-compatible hosted and local AI provider configuration
- Official OpenAI SDK adapter with a server-side `search_jobs` tool
- Firecrawl web search combined with user- and admin-saved public sources
- AES-256-GCM encrypted server-side API-key storage
- Provider connection testing
- User and admin-managed public job-source configuration
- Initial public-source refresh and job-listing normalization
- Firecrawl integration planned for JavaScript-heavy sources; OpenSERP is planned for general web discovery
- Gated-platform credentials and cookies are never collected

## Authentication modes

Set `LOGIN_REQUIRED=false` in local `.env` to bypass Subra Auth and use a stable local development identity. Set `LOGIN_REQUIRED=true` in production to require sign-in through `auth.subraatakumar.com`. Authentication remains required when the variable is omitted.

## Local URLs

- JobSearch: [http://localhost:3020](http://localhost:3020)
- Dashboard: [http://localhost:3020/dashboard](http://localhost:3020/dashboard)
- Profile import: [http://localhost:3020/profile](http://localhost:3020/profile)
- Health check: [http://localhost:3020/api/health](http://localhost:3020/api/health)
- Job search setup: [http://localhost:3020/search](http://localhost:3020/search)
- AI provider setup: [http://localhost:3020/settings](http://localhost:3020/settings)

## Run locally after cloning

The recommended path is Docker because it starts both the web app and PostgreSQL with the expected ports and persistent database volume.

```bash
git clone <your-fork-or-repository-url>
cd jobsearch
cp .env.example .env
```

Open `.env` and set at least a strong `SESSION_SECRET` and a 64-character hexadecimal `PROVIDER_ENCRYPTION_KEY`. For a local-only login-free experience, keep `LOGIN_REQUIRED=false`. Then start the app:

```bash
./re-run-local.sh
```

Visit [http://localhost:3020](http://localhost:3020). The database is persisted in Docker, so normal restarts do not remove your data. Stop the services with `docker compose down`; do not add `-v` unless you intentionally want to remove the local database volume.

The main onboarding path is `/profile` → `/search` → `/settings` → `/dashboard`. The dashboard is the job-search workspace.

## Ollama setup (optional local AI provider)

JobSearch supports Ollama through its OpenAI-compatible API. Install Ollama from [ollama.com/download](https://ollama.com/download), start the Ollama service, and download a model. For example:

```bash
ollama serve
ollama pull llama3.2
```

If Ollama is already running as a background service, `ollama serve` may report that the port is already in use; that is expected. Confirm the model is available with:

```bash
ollama list
```

In JobSearch, open [http://localhost:3020/settings](http://localhost:3020/settings) and enter:

| Setting | Value |
| --- | --- |
| Provider | `Ollama (local)` |
| Model name | `llama3.2` (or another model shown by `ollama list`) |
| API endpoint (Docker workflow) | `http://host.docker.internal:11434/v1` |
| API endpoint (non-Docker workflow) | `http://localhost:11434/v1` |
| API key | Leave blank |

Click **Save provider**, then continue to the dashboard and search jobs. The model must be downloaded locally before it can be used. Larger models generally need more memory and may respond more slowly.

## Development without Docker

Requires Node.js 22 or newer and PostgreSQL.

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run typecheck
npm run build
```

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env`.

- `SESSION_SECRET`: long random secret for the product session cookie
- `POSTGRES_PASSWORD`: local database password
- `DATABASE_URL`: database connection string
- `AUTH_BASE_URL`: browser-facing Auth URL; local default is `http://localhost:3011`
- `AUTH_INTERNAL_URL`: URL the Docker container uses to reach Auth; local default is `http://host.docker.internal:3011`
- `AUTH_CLIENT_ID`: registered OAuth client ID, currently `jobsearch-web`
- `APP_URL`: public application URL, local default is `http://localhost:3020`
- `PROVIDER_ENCRYPTION_KEY`: 32 random bytes encoded as 64 hexadecimal characters; required when saving provider keys
- `ADMIN_EMAILS`: comma-separated email addresses allowed to manage the global public-source catalog
- `FIRECRAWL_URL`: optional URL for a separate self-hosted Firecrawl API (planned)
- `FIRECRAWL_API_KEY`: optional key when the configured Firecrawl instance requires authentication (planned)

## Documentation

- [Guided SDLC learning path](ai-assisted-website-learning/README.md)
- [Architecture](ai-assisted-website-learning/03-architecture.md)
- [Requirements](ai-assisted-website-learning/02-requirements.md)
- [Data and AI design](ai-assisted-website-learning/04-data-and-ai-design.md)
- [Job-source integration design](ai-assisted-website-learning/09-job-source-integration.md)
- [Development history](ai-assisted-website-learning/session-log.md)

## Contributing and suggesting features

Everyone is welcome to contribute—whether you want to fix a bug, improve the UX, add a search provider, write documentation, strengthen privacy, or build one of the unchecked roadmap items above. New ideas are welcome too: please open an issue describing the user problem, the proposed behavior, and any privacy or platform-term considerations before starting a large change.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Contributions should include tests or verification steps where appropriate, update the roadmap when a feature meaningfully changes status, and keep user privacy and platform terms in mind. Small documentation fixes and thoughtful feature suggestions are just as welcome as code.

## Security

Please do not report security vulnerabilities in public issues. Read [SECURITY.md](SECURITY.md) for the reporting process and security boundaries.

## License

This project is available under the [MIT License](LICENSE).

## Run the production container locally

Create a separate production environment file and configure real secrets:

```bash
cp .env.prod.example .env.prod
# Edit .env.prod before starting
./re-run-local.sh prod
```

Production mode uses separate containers and a separate PostgreSQL volume. It exposes the application on `localhost:3021` for Cloudflare Tunnel:

```text
jobs.subraatakumar.com → http://localhost:3021
```

Do not commit `.env.prod`. The script does not delete production volumes during updates.

The guided SDLC documentation is in [ai-assisted-website-learning](ai-assisted-website-learning/README.md).

## Search architecture direction

JobSearch will use a provider abstraction so search and extraction engines can be changed without changing the product workflow. OpenSERP is intended for anonymous, general web discovery. Firecrawl is intended for extracting structured jobs from JavaScript-heavy public career pages. Firecrawl will run as a separate Docker Compose project during validation, normally exposing its API on `localhost:3002`; it will not be bundled into the JobSearch stack initially.

Self-hosted Firecrawl is free software, but its official stack is resource-heavy compared with a small SERP service because it includes browser automation and supporting queue/database services. See the [Firecrawl self-hosting guide](https://github.com/firecrawl/firecrawl/blob/main/SELF_HOST.md) before deploying it.

### Optional service ports and Docker URLs

| Service | Host port | Purpose |
| --- | ---: | --- |
| JobSearch | `3020` | Main local application |
| PostgreSQL | `5433` | Local application database |
| Firecrawl | `3002` | JavaScript-heavy page extraction |
| OpenSERP | `7000` | Anonymous general web discovery |

When JobSearch runs inside Docker, `localhost` means the JobSearch container itself. It does not refer to Firecrawl or OpenSERP. When those services publish ports to the host, use Docker Desktop’s host gateway:

```env
FIRECRAWL_URL=http://host.docker.internal:3002
OPENSERP_URL=http://host.docker.internal:7000
```

If both Compose projects use a shared Docker network, use service names instead:

```env
FIRECRAWL_URL=http://firecrawl-api:3002
OPENSERP_URL=http://openserp:7000
```

The Firecrawl hostname must match its Compose service name; the official file may call it `api`. Create an external network before attaching both projects:

```bash
docker network create jobsearch-services
```

Do not use `http://localhost:3002` or `http://localhost:7000` from the JobSearch container unless the service runs in that same container. Do not expose Firecrawl or OpenSERP through the Cloudflare Tunnel; expose only JobSearch.

Firecrawl can be started separately using its official Compose setup:

```bash
git clone https://github.com/firecrawl/firecrawl.git
cd firecrawl
docker compose up -d
```

OpenSERP provides a Docker image and normally listens on port `7000`:

```bash
docker run --rm \
  -p 127.0.0.1:7000:7000 \
  karust/openserp:latest \
  serve -a 0.0.0.0 -p 7000
```

Self-hosting removes hosted-service request billing, but the operator supplies compute, storage, bandwidth, upgrades, and monitoring. See the [OpenSERP repository](https://github.com/karust/openserp) for its configuration.
