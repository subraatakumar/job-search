# AI-Assisted Website: Guided SDLC Learning

This folder documents the development of an AI-assisted website from idea to production.

The material is written as a guided learning journal for developers. Each step records:

- The question asked by the mentor
- The learner's answer
- The decision made
- What was built or learned
- Open questions and next actions

## Learning path

1. [01-discovery.md](01-discovery.md) — Define the problem and users
2. [02-requirements.md](02-requirements.md) — Convert the idea into requirements
3. [03-architecture.md](03-architecture.md) — Choose the technical design
4. [04-data-and-ai-design.md](04-data-and-ai-design.md) — Plan data, prompts, and AI behavior
5. [05-implementation.md](05-implementation.md) — Build the first version
6. [06-testing-and-evaluation.md](06-testing-and-evaluation.md) — Test the website and AI
7. [07-deployment.md](07-deployment.md) — Release safely
8. [08-monitoring-and-improvement.md](08-monitoring-and-improvement.md) — Operate and improve it
9. [session-log.md](session-log.md) — Chronological record of our mentoring sessions

## Working agreement

We will make one meaningful decision at a time. I will ask mentoring questions, explain why they matter, and document your answers without silently inventing product decisions.

## Open-source direction

The project can be released publicly as open source. The repository should keep the core application, Docker setup, provider interface, documentation, and test suite transparent while keeping all secrets, personal data, credentials, and deployment-specific configuration outside the repository.

## Current search direction

The product separates anonymous discovery from public-page extraction. OpenSERP is planned for general search-engine discovery, while Firecrawl is planned for JavaScript-heavy public career pages. Firecrawl will be run as a separate Docker Compose project during validation so the main JobSearch stack remains smaller and the extraction service stays replaceable.

### License decision

The planned license is the MIT License, held by Subrata Kumar Das. It permits personal use, modification, redistribution, and commercial use, provided that the copyright and license notice are retained. See [LICENSE](LICENSE).
