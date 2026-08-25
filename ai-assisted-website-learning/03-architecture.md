# 03 — Architecture

This document records the initial deployment and integration architecture.

## Docker-based local distribution

Yes. The project should be packaged so people can run it locally with Docker Compose. A first local setup can contain:

- Web frontend
- Backend/API service
- Database, such as PostgreSQL
- Optional scheduler and worker for recurring job searches
- Optional local AI service such as Ollama

Users should be able to clone the repository, copy `.env.example` to `.env`, configure an AI endpoint, and run a documented command such as `docker compose up`. API keys must be supplied through environment variables or a local secret mechanism and must not be baked into the image.

The Docker image should be versioned, include health checks, persist database data through named volumes, and provide a backup/export instruction. A hosted deployment can be added later using the same service boundaries.

## Public and authenticated job sources

We should separate job sources into two categories:

1. Public or officially supported sources: APIs, feeds, company career pages, and user-provided URLs.
2. Authenticated platforms: sites requiring a user login, such as LinkedIn, Naukri, or Wellfound.

Authenticated integrations should only be implemented when the platform permits the intended access and automation. The product should prefer official APIs, partner integrations, exports, alerts, or links that open the platform for the user. Automated scraping or automated application submission can violate platform rules, trigger account restrictions, and create privacy and security risks.

## Login and cookie handling

The app should not ask users to paste browser cookies into the application. Raw session cookies are bearer credentials: anyone who obtains them may be able to use the account without a password.

If an approved integration requires authentication, use the platform's supported OAuth or login flow, store only the minimum tokens needed, encrypt them, restrict access, rotate or revoke them, and provide a disconnect/delete control. For a local-only browser helper, credentials should remain in the user's browser profile where possible; the backend should not receive or persist them.

The initial architecture decision is therefore: public/approved sources first, authenticated sources behind explicit integration review, and no cookie-upload feature.

## Public open-source distribution

The project can be made public on GitHub or another public Git host. A responsible open-source release should include:

- A clear license, chosen before accepting outside contributions
- `README.md` setup instructions and a Docker Compose quick start
- `.env.example` containing variable names but no real values
- A strict `.gitignore` for secrets, local databases, logs, resumes, uploaded files, and browser profiles
- A `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and security-reporting guidance
- Automated tests and CI checks
- A dependency update process and vulnerability reporting process
- Clear documentation that users are responsible for complying with job-platform terms, privacy laws, and local regulations

The open-source boundary should be explicit: the repository may contain connectors and extension points, but contributors must not add credential theft, cookie extraction, bypasses, CAPTCHA evasion, unauthorized scraping, or automatic application submission against platforms that do not permit it.

The planned license is MIT. The final `LICENSE` file should use the copyright holder name supplied by the project owner.

## Reusing the existing Subra Auth service

The existing project at `/Users/subratakumardas/coaching/auth` can be reused. It is a Next.js application using Better Auth and already provides:

- Google sign-in
- Central user and session storage
- OAuth 2.0 authorization-code flow with PKCE
- Exact redirect-URI allowlisting
- Product-specific OAuth clients
- Product-local sessions after sign-in

The job-search website should integrate as a new OAuth client rather than sharing the Auth service's database or cookies. The flow should be:

```text
JobSearch → redirect to auth.subraatakumar.com
          → user signs in or reuses an Auth session
          → Auth redirects to JobSearch callback with an authorization code
          → JobSearch exchanges code using PKCE
          → JobSearch creates its own local session
```

The Auth project currently registers clients for Subra AI and Courses. A new job-search client must be added with exact development and production callback URLs, for example:

- `http://localhost:<port>/api/auth/callback` for local development, if the Auth service permits it
- `https://jobs.<domain>/api/auth/callback` for production

The exact callback URL must be registered in the Auth project; wildcard callbacks should not be used. The job-search app should store only its own session and application data. It should not read or reuse the central Auth cookie directly.

Before implementation, verify the deployed Auth service's allowed origins, token endpoint behavior, local-development policy, logout semantics, and production database backup strategy.

## Confirmed local ports and OAuth URLs

The existing local Docker services use host ports `3011` for Subra Auth, `3101` for Courses, and `3000` for Subra AI. The job-search application will use host port `3020` and container port `3000`:

```text
JobSearch: 3020:3000
Subra Auth: 3011:3000
Courses: 3101:3000
Subra AI: 3000:3000
```

The planned OAuth callback URLs are:

```text
http://localhost:3020/api/auth/callback
https://jobs.subraatakumar.com/api/auth/callback
```

The job-search container listens on port `3000` internally and is exposed as port `3020` on the developer's computer.

## Confirmed technology direction

The job-search application will use Next.js with TypeScript, matching the existing Subra Auth service. The initial architecture is:

- Next.js and React for the web application
- TypeScript for application code
- PostgreSQL for product data
- Subra Auth through OAuth with PKCE for user authentication
- An OpenAI-compatible provider adapter for hosted and local AI endpoints
- Docker Compose for local development
- A scheduler/worker boundary for recurring job searches

For a first public release, use a modular provider interface so the community can add lawful job sources without coupling the core application to one platform. Keep provider-specific integrations isolated, documented, and independently reviewable.

## Status

Initial deployment direction recorded. Detailed technology choices will follow MVP decisions.
