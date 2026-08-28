# JobSearch, Part 2: Giving the Job Search a Local Brain

*The next chapter in building an open-source, AI-assisted international job-search platform.*

> This is the second article in the JobSearch series. In [Part 1](https://dev.to/subraatakumar/building-an-open-source-ai-assisted-international-job-search-platform-39em), I introduced the problem, the product direction, and the first foundations of the platform. This chapter is about what happened next: turning those foundations into a usable search journey and making local AI a first-class option.

Repository: [github.com/subraatakumar/job-search](https://github.com/subraatakumar/job-search)

## The job search begins with a question

Imagine opening a job-search application after a long day.

You have a resume in one tab, a spreadsheet in another, saved searches scattered across several job boards, and a growing list of questions:

- Is this role actually relevant to me?
- Does the company support international candidates?
- Is the listing still active?
- Which version of my experience should I highlight?
- Should I spend an hour applying to this role or move on?

The first version of JobSearch was mostly about building the room: authentication, profiles, resume extraction, preferences, and a protected dashboard. This next version starts furnishing that room.

The product is becoming a workspace where a candidate can describe what they are looking for, search across public sources, inspect the results, and eventually move from discovery to preparation without losing the thread.

That last part matters. Job searching is not just retrieval. It is a sequence of decisions. The application should help people make better decisions, not make hundreds of noisy applications on their behalf.

## From onboarding to a real workspace

The onboarding path now has a clearer shape:

```text
Profile → Job search preferences → AI provider → Search jobs
```

The user can import a text-based PDF resume, review the extracted information, describe countries and roles of interest, choose an AI provider, and arrive at the dashboard search workspace.

The final step is intentionally a dashboard rather than an unrelated jobs page. It is the place where the user’s profile, preferences, search conversation, filters, and future application workflow can meet.

This is a small product decision with a large effect: the interface should follow the user’s mental model. After configuring the assistant, the next thing a person expects is to use it.

## Why local AI belongs in this project

Resumes and job preferences are personal. They contain employment history, skills, locations, contact details, and sometimes sensitive career decisions.

Some users want the quality and convenience of a hosted model. Others want control over where their data goes. Some are experimenting, learning, or working with limited budgets. A single provider assumption would exclude too many of them.

That is why JobSearch uses an OpenAI-compatible provider abstraction. The application can speak the same general API shape while allowing the model to live in different places:

```text
Hosted provider
       or
Local Ollama model
       or
Another compatible server
              ↓
      JobSearch AI adapter
              ↓
     Search, ranking, and preparation
```

The provider is explicit and configurable. API keys are stored server-side and encrypted with AES-256-GCM; they are never returned to the browser. Local Ollama users can leave the API key blank.

This is not a claim that local models are always better. They can be slower, require more memory, and vary in quality. The point is choice. Privacy, cost, performance, and model quality are trade-offs that should belong to the user.

## Running Ollama locally

Ollama makes it practical to run an AI model on your own machine. After installing it from [ollama.com/download](https://ollama.com/download), start the service and download a model:

```bash
ollama serve
ollama pull llama3.2
ollama list
```

Then start JobSearch with Docker, open `/settings`, and enter:

| Setting | Value |
| --- | --- |
| Provider | `Ollama (local)` |
| Model name | `llama3.2` |
| API endpoint with Docker | `http://host.docker.internal:11434/v1` |
| API endpoint without Docker | `http://localhost:11434/v1` |
| API key | Leave blank |

The `host.docker.internal` detail is important. When the web application runs inside Docker, `localhost` means the container, not the host computer where Ollama is running. The host gateway lets the container reach the local Ollama service.

After saving the provider, JobSearch takes the user to the dashboard search workspace. The model is now available for the parts of the workflow that need AI assistance.

## Searching is more than calling an endpoint

The current search direction combines several responsibilities:

1. Accept a natural-language request such as “senior React Native roles in Germany with visa support.”
2. Discover candidate links from configured public sources and web search infrastructure.
3. Verify individual pages where possible.
4. Normalize titles, companies, locations, and URLs.
5. Deduplicate the results.
6. Optionally rank them against the user’s profile.
7. Present evidence and useful explanations instead of a mysterious score.

That pipeline is deliberately server-side. The browser should be the place where users ask questions and review results, not the place where secrets, source orchestration, or provider credentials are exposed.

The search interface also shows progress while discovery, source checking, verification, and ranking happen. This is more honest than displaying a spinner and pretending that every result has the same level of confidence.

## A privacy boundary, not just a feature list

Open-source AI projects often focus on what the model can generate. JobSearch also needs to be clear about what it will not do.

The project is designed around public job information and user control. It does not collect passwords or cookies for gated platforms. It does not aim to bypass CAPTCHAs. It does not silently auto-apply to jobs. It should not fabricate qualifications, sponsorship evidence, or application claims.

The intended workflow is:

```text
Find an opportunity
        ↓
Understand the evidence and fit
        ↓
Improve the application with assistance
        ↓
Review everything yourself
        ↓
Choose whether to apply
```

That human review step is not a temporary limitation. It is part of the product philosophy.

## What is working now

The repository currently includes:

- Dockerized local development with PostgreSQL
- OAuth and PKCE authentication through the central Auth service
- Profile onboarding and review-first PDF resume extraction
- Multi-country search preferences with role, sponsorship, and frequency settings
- Hosted and local OpenAI-compatible AI provider configuration
- Encrypted server-side provider-key storage
- User and admin-managed public job sources
- Initial source refresh and job normalization
- Server-side web search orchestration with optional AI ranking
- A dashboard workspace for searching and reviewing opportunities

This is still an early MVP. Some visible features are foundations rather than finished products. Search history, saved-job persistence, richer matching, and application preparation are active areas for improvement.

## What comes next

The next chapters will move from “find jobs” toward “understand and act.” The roadmap includes:

- More reliable extraction from JavaScript-heavy career pages
- General web discovery through OpenSERP or another interchangeable provider
- Resume-to-job matching with transparent reasons
- Visa-sponsorship evidence and confidence indicators
- Tailored resume and cover-letter preparation
- Interview questions and practice based on a selected role
- Application status, reminders, and follow-up dates
- Scheduled searches and digest notifications
- More automated tests and evaluation datasets

The order may change. Real user feedback should influence it.

## An invitation to build the next chapter

JobSearch is intentionally open source because the job-search experience is different across countries, professions, industries, and career stages. One person may need sponsorship evidence. Another may need accessibility improvements. Someone else may know the best public career sources for a region that the project has not considered yet.

You do not need to arrive with a large pull request. Contributions can be:

- Trying the local setup and reporting friction
- Suggesting a feature or a better onboarding flow
- Improving documentation
- Adding accessibility or responsive UI improvements
- Building a public-source connector
- Improving resume parsing or search evaluation
- Reviewing privacy and security decisions
- Testing Ollama with different models
- Helping define what “job fit” should mean in practice

Please start with the repository’s [CONTRIBUTING.md](https://github.com/subraatakumar/job-search/blob/main/CONTRIBUTING.md), and open an issue for a substantial feature so the design can be discussed before implementation. Feature suggestions are especially welcome when they describe the user problem, not only the proposed button or endpoint.

## Stay for the next update

The first article introduced the idea. This chapter gave the idea a local brain and a clearer destination: a search workspace that respects the person using it.

The next update will focus on making results more trustworthy and useful—better source handling, stronger matching explanations, and the first steps toward turning a job listing into a tailored preparation plan.

If you are searching internationally, building developer tools, interested in local AI, or simply curious about open-source product development, follow along. Try the project, tell me where the experience breaks, suggest what should be built next, and help shape the tool before the roadmap is set in stone.

The best version of JobSearch will not come from one person guessing what everyone needs. It will come from people bringing their own job-search stories to the project.

---

*JobSearch is released under the MIT License. Please review the project’s security guidance before reporting sensitive issues or contributing integrations that handle personal data.*
