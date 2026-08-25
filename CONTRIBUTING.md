# Contributing to JobSearch

Thank you for contributing.

## Development workflow

1. Fork the repository and create a focused branch.
2. Copy `.env.example` to `.env` and configure local services.
3. Run `./re-run-local.sh` or `npm run dev`.
4. Make a focused change with clear documentation.
5. Run `npm run typecheck` and `npm run build`.
6. Open a pull request describing the change, testing performed, and any migration or environment-variable impact.

## Contribution principles

- Do not commit secrets, personal resumes, API keys, cookies, tokens, database files, or generated build output.
- Do not invent user qualifications or job facts in AI features.
- Keep AI output reviewable and traceable where possible.
- Do not add cookie extraction, CAPTCHA bypassing, unauthorized scraping, or prohibited automatic applications.
- Prefer small, composable changes over broad rewrites.
- Update the relevant SDLC document or session log when a product or architecture decision changes.

## Pull requests

Include screenshots for meaningful UI changes, explain privacy or security implications, and call out any new dependency. Maintainers may request changes that improve accessibility, reliability, or platform compliance.
