# 01 — Discovery: Define the problem

## Goal

Understand who the website is for, what problem it solves, and where AI provides real value.

## Mentor question 1

What website do you want to build, and what problem should it solve for its users?

Please answer in this format if helpful:

```text
Website idea:
Target users:
Problem today:
Desired outcome:
How AI might help:
```

## Why this question matters

AI should support a clearly defined user problem. Starting with a model or chatbot before defining the problem often produces an impressive demo without a useful product.

## Learner answer

The product is a job-search website for people applying internationally. A user may be in India and search for jobs in a location such as Germany, with a preference for employers that sponsor visas.

The website should:

- Search jobs for selected locations and visa-sponsorship preferences
- Run searches at a frequency selected by the user
- Support OpenAI-compatible AI endpoints
- Allow the user to connect a local model endpoint such as Ollama or a hosted endpoint such as ChatGPT/OpenAI
- Create job-specific cover letters and resumes
- Prepare interview questions and answers for a specific role
- Track application status

## Initial product direction

The first version should be an international job-search and application-preparation assistant. It should help the user discover suitable jobs, understand sponsorship requirements, tailor application materials, prepare for interviews, and track progress. The user remains responsible for reviewing documents and submitting applications.

## Important additions to consider

### Job discovery quality

- Use permitted job-board APIs, RSS feeds, company career pages, or user-provided sources rather than uncontrolled scraping.
- Store the source URL, employer, posting date, expiry date, location, remote status, salary, required skills, and sponsorship wording.
- Detect duplicate jobs across sources and mark expired or suspicious listings.
- Provide filters for seniority, employment type, salary, remote or hybrid work, language, and relocation support.

### Visa and eligibility intelligence

- Distinguish explicit sponsorship from vague claims such as “relocation support.”
- Show the evidence from the job posting and label AI conclusions as estimates, not legal advice.
- Capture the user's profile: nationality, current location, work authorization, education, experience, notice period, language ability, and relocation preferences.
- Add a confidence score and a manual confirmation step before classifying a job as sponsorship-friendly.

### Application quality and safety

- Maintain a structured master resume and generate a tailored version without inventing experience, skills, education, or achievements.
- Keep versions of every generated resume and cover letter linked to the exact job posting used.
- Highlight missing qualifications and explain why the user may or may not be a match.
- Require user review before copying, downloading, emailing, or submitting any application.
- Avoid automatic mass applications unless the user explicitly enables a carefully limited workflow.

### Preparation and tracking

- Generate interview questions from the job description, company information, and the user's actual experience.
- Support practice answers, scoring rubrics, STAR-format guidance, and follow-up questions.
- Track stages such as saved, preparing, applied, assessment, interview, offer, rejected, withdrawn, and archived.
- Store deadlines, contacts, notes, tasks, reminders, and follow-up dates.
- Add analytics such as applications per week, response rate, interview rate, and common missing skills.

### AI provider flexibility

- Define one provider interface using an OpenAI-compatible API format.
- Store provider settings separately from application data.
- Support model name, endpoint URL, API key, timeout, context window, and optional embedding configuration.
- Never send private resume or profile data to a provider without clear user consent.
- Provide a model capability check and a fallback when a provider is unavailable.

### Privacy and compliance

- Treat resumes, personal details, contact information, and job history as sensitive data.
- Encrypt secrets and avoid storing API keys in browser code or logs.
- Provide export and delete functions.
- Define retention, consent, audit-log, and backup policies.
- Check the terms of every job source and comply with applicable privacy and employment regulations.

## Decision

We will design this as a user-controlled job-search assistant, not an autonomous application bot. The initial emphasis is trustworthy job matching, visa-sponsorship evidence, tailored preparation, and application tracking.

## What we learned

The product has four connected workflows:

```text
Discover jobs → Evaluate fit and sponsorship → Prepare application → Track and improve
                                             ↓
                                      Prepare for interview
```

The biggest product risks are inaccurate sponsorship classification, hallucinated application content, unreliable job data, privacy leakage, and uncontrolled AI/API costs.

## Next action

Next, define the MVP boundaries: which job sources and which application-tracking features will be included in the first release.
