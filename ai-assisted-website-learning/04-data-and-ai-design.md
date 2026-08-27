# 04 — Data and AI Design

This document records the initial resume-ingestion strategy.

## Resume and profile ingestion

The product will support both structured manual profile entry and PDF resume upload. An uploaded PDF will be parsed into a draft profile containing contact details, summary, skills, work history, education, certifications, languages, and links.

The workflow is:

```text
Upload PDF → Extract text → Parse draft profile → User reviews → Confirm master profile
```

Extraction is not treated as truth. Each field should retain provenance such as `uploaded_resume`, `user_entered`, or `ai_suggested`. The system should show uncertain fields, preserve the original file, prevent fabricated qualifications, and require confirmation before using the profile to generate applications.

PDF files and extracted text contain sensitive personal information and require access control, retention limits, and deletion support.

## AI provider configuration

The application accepts hosted or local OpenAI-compatible providers, including Ollama. Provider settings are user-scoped. API keys are encrypted with AES-256-GCM before PostgreSQL persistence; the API exposes only whether a key exists, and decrypts it only for a server-side connection test or future AI request.

The current provider layer does not imply complete OpenAI feature parity. Tool calling, structured output, streaming, and model capabilities must be detected or tested per provider. Future tools must be explicitly allowlisted and validated server-side.

Job-source ingestion follows a similar boundary: public HTTPS pages and authorized APIs may be fetched; gated sources require official integrations or user-controlled manual import. Credentials and session cookies are out of scope for storage.

The planned web-search layer separates discovery from extraction. OpenSERP can provide general search-engine results, while self-hosted Firecrawl can render and extract content from JavaScript-heavy public career pages. Both are called server-side through adapters and produce the same normalized job shape before AI matching. The AI provider is used for matching and document preparation, not as a substitute for deterministic source retrieval.

## MVP PDF scope

The first version supports text-based PDFs with an embedded text layer. Scanned or image-only PDFs will be detected and shown an explanatory message rather than sent through an OCR workflow.

OCR support is a future enhancement and will require separate evaluation for accuracy, privacy, processing cost, and multilingual resumes.

## Status

Resume/profile ingestion is implemented. AI provider persistence and connection testing are implemented. Job-description parsing, resume-to-job scoring, and safe tool execution remain planned.
