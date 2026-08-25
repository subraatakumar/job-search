# Security Policy

## Reporting a vulnerability

Please do not open a public issue for a security vulnerability. Contact the repository maintainer privately through the security contact configured on the repository, including a description, impact, reproduction steps, and affected version. Do not include real user resumes, API keys, cookies, or other secrets.

## Security boundaries

JobSearch handles sensitive profile and application data. Contributions must protect secrets, isolate user data, validate uploaded files, and avoid logging credentials or private documents.

The project must not implement credential or cookie extraction, CAPTCHA evasion, unauthorized scraping, or automatic application submission against platforms that do not permit it.

## Local security

- Keep `.env` out of Git.
- Use a unique `SESSION_SECRET` locally.
- Do not expose local PostgreSQL or Auth services publicly.
- Delete test resumes and generated personal data after testing.
