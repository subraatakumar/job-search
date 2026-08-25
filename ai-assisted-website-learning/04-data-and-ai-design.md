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

## MVP PDF scope

The first version supports text-based PDFs with an embedded text layer. Scanned or image-only PDFs will be detected and shown an explanatory message rather than sent through an OCR workflow.

OCR support is a future enhancement and will require separate evaluation for accuracy, privacy, processing cost, and multilingual resumes.

## Status

Not started.
