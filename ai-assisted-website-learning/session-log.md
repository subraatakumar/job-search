# Mentoring Session Log

## Session 1 — Documentation setup

### Completed

- Created the guided-learning folder.
- Defined the SDLC learning path.
- Added one Markdown file for each major phase.
- Added the first discovery question.

### Current focus

Define the MVP boundaries and choose trustworthy job sources before selecting technology.

### Next session input

Answer these mentoring questions:

1. Which job sources should the first version support: a few official APIs, company career pages, user-provided URLs, or another approach?
2. What is the smallest useful first release: job search plus tracking, or job search plus AI-generated application documents as well?
3. Should the first version be single-user and local/private, or a multi-user hosted application?

### New architecture questions

4. Should Docker include Ollama as an optional service, or should users configure any OpenAI-compatible endpoint externally?
5. For LinkedIn, Naukri, and Wellfound, do you want the first version to store links and user-imported jobs, or should we investigate approved APIs/integrations one platform at a time?

### Open-source decision

The project may be released publicly as open source. Before the first public release, we need to choose a license and define the repository's security and platform-integration boundaries.

### Next open-source question

### License decision

Selected: MIT License.

Reason: the project should be permissive and business-friendly, allowing companies and individuals to use and extend it while preserving the required copyright and license notice.

### Next open-source question

6. What copyright holder name should appear in the MIT license: your personal name, a company/organization name, or project contributors?

Answer: `Subrata Kumar Das`.

Completed: added the MIT license with copyright year 2026.

### MVP source decision

Selected: a combination of public job APIs, permitted company career pages, and user-provided job URLs.

Reason: this gives the MVP useful coverage while keeping the first version simpler, more portable, and less dependent on gated-platform permissions.

### Next mentoring question

7. Should the MVP be designed first as a private single-user Docker application, or as a multi-user hosted application with accounts and cloud storage?

### Authentication discovery

The correct existing project is `/Users/subratakumardas/coaching/auth`, shown in the user's screenshot. Inspection confirmed that it uses Better Auth, Google sign-in, OAuth authorization code with PKCE, and registered product clients.

### Authentication decision

Reuse the existing central Auth service for user identity. The job-search product will have its own OAuth client and its own product session. It will not share or directly read Auth cookies.

### Next authentication question

8. What production hostname should the job-search website use, and what local development port should its OAuth callback use?

Answer: use `jobs.subraatakumar.com` in production and expose the local job-search container on host port `3020`, mapped to container port `3000`.

Confirmed OAuth callbacks:

- `http://localhost:3020/api/auth/callback`
- `https://jobs.subraatakumar.com/api/auth/callback`

This avoids the existing local service ports: Auth `3011`, Courses `3101`, and Subra AI `3000`.

### Technology decision

Selected: Next.js with TypeScript, matching the existing Subra Auth project.

Initial supporting technologies: React, PostgreSQL, Docker Compose, Subra Auth OAuth with PKCE, an OpenAI-compatible provider adapter, and a scheduler/worker boundary for recurring searches.

### Implementation milestone 1

Created the initial application skeleton:

- Next.js and TypeScript configuration
- Dockerfile with standalone production build
- Docker Compose with the web service on `3020:3000`
- PostgreSQL service on host port `5433`
- Home page and dashboard placeholder
- `/api/health` endpoint
- Environment and Docker ignore files

The dashboard is currently a placeholder; Subra Auth OAuth protection is the next implementation milestone.

### Implementation milestone 2

Added the first Subra Auth integration boundary:

- PKCE login route at `/api/auth/login`
- OAuth callback at `/api/auth/callback`
- State and verifier cookies
- Product-local signed session cookie
- Dashboard redirect for unauthenticated users
- Configurable `AUTH_CLIENT_ID`, issuer, and application URL

End-to-end login remains pending until the `jobsearch-web` client is registered in Subra Auth with the exact local and production callback URLs. The OAuth endpoint paths and user-info response should also be verified against the deployed Auth service before production use.

### Implementation milestone 3

Registered `jobsearch-web` in `/Users/subratakumardas/coaching/auth/lib/oauth-client.ts` with PKCE and these exact callbacks:

- `http://localhost:3020/api/auth/callback`
- `https://jobs.subraatakumar.com/api/auth/callback`

Dependency installation for the job-search project was attempted but did not complete in the available environment, so build and runtime verification remain pending.

### Implementation milestone 4

Added `re-run-local.sh` for open-source contributors. It checks Docker, creates `.env` guidance, builds the containers, starts PostgreSQL and JobSearch, waits for `/api/health`, and prints local URLs. It preserves the PostgreSQL named volume and does not perform destructive cleanup.

### Bug fix — Docker hostname redirect

The OAuth callback was redirecting to the internal Docker hostname because it derived the dashboard URL from the incoming request. The callback now redirects using the configured `APP_URL`, and Compose passes `APP_URL` and `SESSION_SECRET` into the container. Local redirects should now remain on `http://localhost:3020`.

### Verification note

The source structure was reviewed locally. Dependencies have not yet been installed in this new project, so Docker build and TypeScript checks remain pending.

### Profile and resume decision

The product will support both structured manual profile entry and PDF resume upload. PDF extraction creates a reviewable draft; the user must confirm the extracted fields before they become the master profile.

Decision: the MVP supports text-based PDFs only. Image-only or scanned PDFs will be detected and rejected with guidance; OCR is deferred to a later milestone.

### Implementation milestone 5

Added the first resume-import workflow: protected `/profile` page, PDF upload form, server-side extraction endpoint at `/api/profile/resume`, 5 MB limit, PDF validation, image-only PDF rejection, and extracted-text draft preview. The draft is not persisted yet; the next step is editable profile fields and confirmation.

### Next mentoring question

9. Should the first PDF workflow support only text-based PDFs, or should it also attempt OCR for scanned/image-based resumes?
