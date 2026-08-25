import { NextResponse } from "next/server";
// Import the parser implementation directly. The package root enables a
// command-line debug fixture during Next.js route collection, which is not
// appropriate for a server endpoint.
import pdf from "pdf-parse/lib/pdf-parse.js";
import { readSession } from "@/lib/session";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = readSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("resume");
  if (!(file instanceof File)) return NextResponse.json({ error: "Upload a PDF resume" }, { status: 400 });
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Only PDF files are supported" }, { status: 415 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "PDF must be 5 MB or smaller" }, { status: 413 });
  const result = await pdf(Buffer.from(await file.arrayBuffer()));
  const text = result.text.replace(/\u0000/g, "").trim();
  if (text.length < 80) return NextResponse.json({ error: "This appears to be an image-only or unreadable PDF. OCR is not supported in the MVP." }, { status: 422 });
  return NextResponse.json({ filename: file.name, characters: text.length, draft: { rawText: text, source: "uploaded_resume", status: "needs_review" } });
}
