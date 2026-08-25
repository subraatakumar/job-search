# JobSearch

![JobSearch — AI-assisted international job search](docs/images/jobsearch-hero.png)

AI-assisted international job search and application preparation.

## Project status

Early open-source MVP. Authentication and the Docker workflow are working. Resume import currently supports text-based PDFs and creates a reviewable draft; structured profile persistence and job-source integrations are next.

## Features

- Central authentication through Subra Auth using OAuth and PKCE
- Dockerized local development
- PostgreSQL-backed application foundation
- Text-based PDF resume extraction
- Review-first profile workflow
- Planned OpenAI-compatible hosted and local AI providers

## Local URLs

- JobSearch: [http://localhost:3020](http://localhost:3020)
- Dashboard: [http://localhost:3020/dashboard](http://localhost:3020/dashboard)
- Profile import: [http://localhost:3020/profile](http://localhost:3020/profile)
- Health check: [http://localhost:3020/api/health](http://localhost:3020/api/health)

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

## Documentation

- [Guided SDLC learning path](ai-assisted-website-learning/README.md)
- [Architecture](ai-assisted-website-learning/03-architecture.md)
- [Requirements](ai-assisted-website-learning/02-requirements.md)
- [Data and AI design](ai-assisted-website-learning/04-data-and-ai-design.md)
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

The guided SDLC documentation is in [ai-assisted-website-learning](ai-assisted-website-learning/README.md).
