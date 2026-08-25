import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import ResumeUpload from "./resume-upload";

export default async function ProfilePage() {
  const session = readSession(new Request("http://localhost", { headers: await headers() }));
  if (!session) redirect("/api/auth/login");
  return <main><nav className="topbar"><a href="/dashboard">JobSearch</a><a href="/dashboard">Dashboard</a></nav><div className="eyebrow">Profile setup</div><h1>Build your master profile</h1><p>Start with your resume. We’ll extract a draft profile for you to review before it is used for applications.</p><ResumeUpload /></main>;
}
