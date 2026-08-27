"use client";

import { FormEvent, useState } from "react";

type Source = { id: string; name: string };
type Job = {
  id?: string;
  title: string;
  company: string;
  location: string;
  remote?: boolean;
  source?: string;
  source_url?: string;
  url?: string;
  matchScore?: number;
  matchReasons?: string[];
  workMode?: "remote" | "hybrid" | "on-site" | "unknown";
  visaSupport?: "yes" | "no" | "unknown";
  aiVerified?: boolean;
};

type ProgressStage = "idle" | "discovering" | "sources" | "verifying" | "formatting";

const stages: Array<{ id: Exclude<ProgressStage, "idle">; label: string }> = [
  { id: "discovering", label: "Searching the web for current openings" },
  { id: "sources", label: "Checking your additional saved sources" },
  { id: "verifying", label: "Opening and verifying individual job pages" },
  { id: "formatting", label: "Ranking matches and preparing your shortlist" },
];

export default function Workspace({
  firstName,
  email,
  countries,
  profileSkills,
  sources,
  jobs,
}: {
  firstName: string;
  email: string;
  countries: string[];
  profileSkills: string;
  sources: Source[];
  jobs: Job[];
}) {
  const availableSkills = profileSkills.split(",").map((skill) => skill.trim()).filter(Boolean);
  const [query, setQuery] = useState("");
  const [customSkills, setCustomSkills] = useState("");
  const [selectedCountries, setSelectedCountries] = useState(countries);
  const [workPreferences, setWorkPreferences] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<ProgressStage>("idle");
  const [messages, setMessages] = useState([
    "Tell me what role you want to find. I’ll search the web and your saved public sources.",
  ]);
  const [results, setResults] = useState<Job[]>(jobs);
  const [history, setHistory] = useState<string[]>([]);

  const toggle = (value: string, values: string[], update: (next: string[]) => void) => {
    update(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  function buildSearchText() {
    const skills = [...selectedSkills, ...customSkills.split(",").map((skill) => skill.trim()).filter(Boolean)];
    const parts = [
      query.trim(),
      skills.length ? `${skills.join(" or ")} jobs` : "",
      selectedCountries.length ? `in ${selectedCountries.join(", ")}` : "",
      workPreferences.length ? workPreferences.join(", ") : "",
    ].filter(Boolean);
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const searchText = buildSearchText();
    if (!searchText || busy) return;

    setBusy(true);
    setStage("discovering");
    setResults([]);
    setMessages((current) => [...current, `You: ${searchText}`]);
    setHistory((current) => [searchText, ...current.filter((item) => item !== searchText)].slice(0, 8));

    try {
      const webPromise = fetch("/api/jobs/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: searchText }),
      }).then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Job search failed.");
        return payload;
      });

      setStage("sources");
      const web = await webPromise;
      setStage("verifying");
      const found = (web.jobs ?? []) as Job[];
      const savedCount = Number(web.savedJobCount ?? 0);

      setStage("formatting");
      setResults(found);
      setMessages((current) => [
        ...current,
        found.length
          ? `Found ${found.length} verified job openings across the web${savedCount ? ` and ${savedCount} from saved sources` : ""}.${web.aiEnhanced ? " Your AI provider validated and ranked the combined results against your profile." : ""}${web.aiWarning ? " AI ranking was unavailable, so verified search results are shown without AI scoring." : ""}`
          : "No verified individual job openings matched this search. Try a role title, fewer filters, or another country.",
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        error instanceof Error ? error.message : "Search failed. Check Firecrawl and try again.",
      ]);
    } finally {
      setStage("idle");
      setBusy(false);
    }
  }

  return (
    <section className="job-search-workspace">
      <div className="search-workspace-shell">
        <aside className="search-history">
          <div className="sidebar-identity">
            <div className="section-label">Your workspace</div>
            <h1>Welcome back,<br />{firstName}.</h1>
            <p>Find roles that match your profile and preferences.</p>
            <span className="account-chip">{email}</span>
          </div>
          <div className="history-heading">
            <strong>Search history</strong>
            <button
              className="new-search-button"
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setMessages(["What should I search for next?"]);
              }}
            >
              + New search
            </button>
          </div>
          {history.map((item) => (
            <button className="history-item" type="button" key={item} onClick={() => setQuery(item)}>
              <span>{item}</span>
            </button>
          ))}
        </aside>

        <div className="conversation-panel">
          <div className="conversation-header">
            <div>
              <div className="section-label">Search assistant</div>
              <h2>{query || "Start a new job search"}</h2>
            </div>
            <span className="assistant-status"><i /> {busy ? "Working…" : "Ready"}</span>
          </div>

          <div className="conversation-feed" aria-live="polite">
            {messages.map((message, index) => (
              <div className={`message ${message.startsWith("You:") ? "message-user" : "message-assistant"}`} key={`${message}-${index}`}>
                <span className="message-label">{message.startsWith("You:") ? "You" : "JobSearch"}</span>
                <p>{message}</p>
              </div>
            ))}

            {busy && (
              <div className="search-progress">
                <div className="search-progress-heading"><span className="search-spinner" /> Searching and verifying jobs</div>
                {stages.map((item) => {
                  const currentIndex = stages.findIndex((entry) => entry.id === stage);
                  const itemIndex = stages.findIndex((entry) => entry.id === item.id);
                  return (
                    <div className={`search-progress-stage ${itemIndex < currentIndex ? "complete" : item.id === stage ? "active" : ""}`} key={item.id}>
                      <span>{itemIndex < currentIndex ? "✓" : item.id === stage ? "●" : "○"}</span>
                      {item.label}
                    </div>
                  );
                })}
              </div>
            )}

            {!busy && results.length > 0 && (
              <div className="job-results-table">
                <div className="job-results-heading">Verified opportunities</div>
                <div className="job-result-row job-result-header" aria-hidden="true">
                  <span>Company</span><span>Role</span><span>Location / Mode</span><span>Match</span><span>Apply</span>
                </div>
                {results.slice(0, 20).map((job) => (
                  <div className="job-result-row" key={job.id ?? job.url ?? job.source_url}>
                    <span data-label="Company"><strong>{job.company || job.source || "Company not listed"}</strong></span>
                    <span data-label="Role">
                      <strong>{job.title}</strong>
                      {job.matchReasons?.length ? <small className="match-reasons">{job.matchReasons.join(" · ")}</small> : null}
                    </span>
                    <span data-label="Location">{job.workMode && job.workMode !== "unknown" ? `${job.location || "Not specified"} · ${job.workMode}` : job.remote ? "Remote" : job.location || "Not specified"}</span>
                    <span data-label="Match">
                      {typeof job.matchScore === "number" ? <span className="match-score">{job.matchScore}%</span> : <span className="match-unscored">Not scored</span>}
                    </span>
                    <span data-label="Apply">
                      <a href={job.source_url ?? job.url} target="_blank" rel="noreferrer">View job ↗</a>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form className="chat-composer" onSubmit={submit}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask for a role, location, or visa preference…" />
            <button className="primary-button" type="submit" disabled={busy}>{busy ? "Searching…" : "Search jobs →"}</button>
          </form>
        </div>

        <aside className="search-filters">
          <div className="filter-section">
            <strong>Countries</strong>
            {countries.map((country) => (
              <label key={country}>
                <input type="checkbox" checked={selectedCountries.includes(country)} onChange={() => toggle(country, selectedCountries, setSelectedCountries)} />
                {country}
              </label>
            ))}
          </div>
          <div className="filter-section">
            <strong>Work preferences</strong>
            {["Remote", "On-site", "Hybrid", "Visa support"].map((preference) => (
              <label key={preference}>
                <input type="checkbox" checked={workPreferences.includes(preference)} onChange={() => toggle(preference, workPreferences, setWorkPreferences)} />
                {preference}
              </label>
            ))}
          </div>
          <div className="filter-section">
            <strong>Skills</strong>
            {availableSkills.map((skill) => (
              <label key={skill}>
                <input type="checkbox" checked={selectedSkills.includes(skill)} onChange={() => toggle(skill, selectedSkills, setSelectedSkills)} />
                {skill}
              </label>
            ))}
            <input className="custom-skills" value={customSkills} onChange={(event) => setCustomSkills(event.target.value)} placeholder="Add skills, comma separated" />
          </div>
        </aside>
      </div>
    </section>
  );
}
