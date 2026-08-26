"use client";

import { useState } from "react";
import ProfileReview from "./profile-review";

type ProfileValues = { name: string; email: string; phone: string; headline: string; location: string; countries: string; skills: string };

export default function ResumeUpload({ existingProfile }: { existingProfile?: ProfileValues }) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  if (existingProfile) return <section className="card upload-card"><ProfileReview rawText="" initialProfile={existingProfile} /></section>;

  function acceptFile(candidate: File | undefined) {
    if (!candidate) return;
    if (candidate.type !== "application/pdf" && !candidate.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setMessage("Please choose a PDF resume.");
      return;
    }
    if (candidate.size > 5 * 1024 * 1024) {
      setFile(null);
      setMessage("PDF must be 5 MB or smaller.");
      return;
    }
    setFile(candidate);
    setMessage("");
  }
  async function upload() {
    if (!file) return setMessage("Choose a PDF first.");
    setBusy(true); setMessage("");
    const form = new FormData(); form.append("resume", file);
    const response = await fetch("/api/profile/resume", { method: "POST", body: form });
    const result = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(result.error ?? "Upload failed.");
    setText(result.draft.rawText); setMessage(`Extracted ${result.characters.toLocaleString()} characters from ${result.filename}. Review required.`);
  }
  return <section className="card upload-card"><div className="section-heading"><div><h2>Import your resume</h2><p className="muted">PDF only · Up to 5 MB · Text-based files</p></div><span className="step-badge">Step 1 of 3</span></div><label className={`dropzone${dragging ? " dropzone-active" : ""}`} htmlFor="resume-file" onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { event.preventDefault(); setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files?.[0]); }}><span className="upload-icon">↑</span><strong>{file ? file.name : dragging ? "Release to upload" : "Drop your resume here"}</strong><span>{file ? "Ready to extract" : "or click to browse from your computer"}</span><input id="resume-file" type="file" accept="application/pdf,.pdf" onChange={(event) => acceptFile(event.target.files?.[0])} /></label><div className="privacy-note">🔒 Your resume stays in your private workspace. You’ll review every extracted detail.</div><button className="primary-button" type="button" onClick={upload} disabled={busy || !file}>{busy ? "Extracting resume…" : "Extract resume text"}</button>{message && <p className={text ? "success-message" : "error-message"}>{message}</p>}{text && <ProfileReview rawText={text} />}</section>;
}
