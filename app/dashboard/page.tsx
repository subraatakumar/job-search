import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";

export default async function DashboardPage() {
  const requestHeaders = await headers();
  const session = readSession(new Request("http://localhost", { headers: requestHeaders }));
  if (!session) redirect("/api/auth/login");
  return (
    <main>
      <div className="eyebrow">Dashboard</div>
      <h1>Your job search workspace</h1>
      <p>Signed in as {session.email ?? session.id}.</p>
      <section className="card">
        <h2>Authentication boundary</h2>
        <p>Only an authenticated user should be able to access profile, saved jobs, documents, and application data.</p>
      </section>
    </main>
  );
}
