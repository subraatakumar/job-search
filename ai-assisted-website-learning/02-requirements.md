# 02 — Requirements

## Job-source boundary

Users can configure public career-page URLs and permitted official integrations. The MVP must not request, store, or replay passwords, session cookies, or browser-cookie exports for gated platforms. Users may instead paste a job URL or upload a job description for manual import.

This document records the first requirements derived from discovery. We will refine them after choosing the MVP scope.

## Initial functional requirements

- A user can create and edit an international job-search profile.
- A user can enter profile and resume information through structured forms.
- A user can upload a PDF resume for extraction into a draft structured profile.
- The user must review and confirm extracted information before it becomes the master profile.
- The original uploaded resume must be retained separately from generated documents.
- A user can configure target countries, cities, roles, keywords, salary, remote preference, and visa sponsorship preference.
- A user can configure search frequency and pause or resume scheduled searches.
- The system can collect jobs from approved sources and retain source evidence.
- The system can deduplicate, filter, rank, and save jobs.
- A user can connect an OpenAI-compatible hosted or local AI endpoint.
- The system can generate job-specific resumes, cover letters, and interview preparation materials using user-approved information.
- A user can review, edit, download, and version generated documents.
- A user can track applications, deadlines, notes, contacts, and status history.

## MVP job-source scope

The MVP will combine:

- Public job APIs where available
- Company career pages and other permitted public sources
- User-provided job URLs for manual import

Every imported job should retain its source URL and retrieval time. The system should normalize job fields, identify likely duplicates, and allow the user to correct imported information before relying on it for AI-generated documents.

Authenticated platform automation is outside the initial MVP scope.

## Initial non-functional requirements

- Do not fabricate user qualifications or job facts.
- Preserve provenance for extracted profile fields and distinguish user-confirmed data from AI suggestions.
- Protect API keys and personal application data.
- Make AI-generated claims traceable to source text where possible.
- Support graceful failure when a job source or AI provider is unavailable.
- Make scheduling observable and prevent duplicate notifications.
- Support export and deletion of user data.
- Provide a Docker Compose setup for local installation and testing.
- Persist local data safely and document backup and restore.
- Separate public job sources from authenticated integrations.
- Never require users to paste raw platform cookies into the app.
- Require explicit review of a platform's permitted integration method before adding it.
- Publish reproducible local setup instructions and license the source code clearly.
- Ensure no secrets, personal resumes, cookies, tokens, or production data are committed.
- Provide a documented and reviewable extension interface for job sources and AI providers.

## Status

Not started. We will complete this after `01-discovery.md`.
