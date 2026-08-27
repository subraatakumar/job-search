# 07 — Deployment

This document will record release preparation, environments, secrets, CI/CD, rollout, rollback, and production readiness.

## Status

The JobSearch application has local and production-like Docker Compose workflows. The production-like app uses port `3021` for the Cloudflare Tunnel at `jobs.subraatakumar.com`.

## Separate Firecrawl service

Firecrawl will be deployed separately during validation. Its official Docker Compose setup publishes the API on port `3002` by default and includes browser automation plus supporting queue and database services. JobSearch will call it through a server-side URL such as:

```env
FIRECRAWL_URL=http://localhost:3002
```

Self-hosting removes hosted request billing, but the operator remains responsible for CPU, memory, storage, bandwidth, persistence, upgrades, and monitoring. OpenSERP is a lighter optional service for general search discovery and can be deployed independently.
