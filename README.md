# JobSearch

![JobSearch — AI-assisted international job search](docs/images/jobsearch-hero.png)

AI-assisted international job search and application preparation.

## Project status

Early open-source MVP. Authentication, Docker workflow, profile onboarding, multi-country search preferences, encrypted AI-provider configuration, public source management, and an initial source refresh flow are working. Dynamic-source extraction and resume-to-job matching are the next milestones.

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

## Local URLs

- JobSearch: [http://localhost:3020](http://localhost:3020)
- Dashboard: [http://localhost:3020/dashboard](http://localhost:3020/dashboard)
- Profile import: [http://localhost:3020/profile](http://localhost:3020/profile)
- Health check: [http://localhost:3020/api/health](http://localhost:3020/api/health)
- Job search setup: [http://localhost:3020/search](http://localhost:3020/search)
- AI provider setup: [http://localhost:3020/settings](http://localhost:3020/settings)

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

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Contributions should include tests or verification steps where appropriate and should keep user privacy and platform terms in mind.

## Security

Please do not report security vulnerabilities in public issues. Read [SECURITY.md](SECURITY.md) for the reporting process and security boundaries.

## License

This project is available under the [MIT License](LICENSE).

## Run locally with Docker

Requirements: Docker Desktop and `curl`.

```bash
cp .env.example .env
# Review .env and set a strong SESSION_SECRET
./re-run-local.sh
```

The script stops any previous JobSearch containers, then builds and starts JobSearch at `http://localhost:3020` and PostgreSQL at `localhost:5433`. It preserves database data in a Docker volume and does not delete volumes during normal updates.

To stop the services without deleting data:

```bash
docker compose down
```

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
