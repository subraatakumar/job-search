# 05 — Implementation

This document records the development steps, code decisions, local setup, and incremental milestones.

## Implemented so far

- OAuth/PKCE authentication through the shared Subra Auth service.
- Docker Compose local and production-like workflows with separate ports and volumes.
- Text-based PDF resume extraction with size/type validation and scanned-PDF rejection.
- Review-first profile editing with PostgreSQL persistence.
- Searchable local country dataset and removable selected-country chips.
- Multiple country-specific searches with roles, sponsorship preference, and daily/weekly/monthly/manual frequency.
- Four-step onboarding UI shared across dashboard, profile, and search screens.
- Encrypted AI provider API-key storage, saved-provider loading, and server-side connection testing.
- Authenticated user/admin public-source management, optional country association, and on-demand source refresh.
- Initial HTML job-link extraction and normalized job persistence, with a provider boundary for future extraction engines.

## Current next milestone

Integrate self-hosted Firecrawl as a separate Docker service for JavaScript-heavy public sources, add OpenSERP later for anonymous general discovery, and then compare structured candidate profile data with job requirements using an explainable match score.

## Status

In progress.
