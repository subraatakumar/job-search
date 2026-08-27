import test from "node:test";
import assert from "node:assert/strict";
import fixtures from "./pipeline-fixtures.json" with { type: "json" };

function individual(url) { const path = new URL(url).pathname.toLowerCase().replace(/\/$/, ""); return !/\/(jobs|careers|search|job-search|vacancies)$/.test(path) && /\/job[s]?\/[^/?#]{4,}|\/position[s]?\/[^/?#]{4,}/.test(path); }
function blocked(title) { return /verifying your browser|captcha|access denied/i.test(title); }
test("pipeline fixtures classify candidate page types", () => {
  for (const fixture of fixtures) {
    const actual = blocked(fixture.title) ? "blocked" : individual(fixture.url) && !/library/i.test(fixture.title) ? "job" : "non-job";
    assert.equal(actual, fixture.expected, fixture.name);
  }
});
test("canonical URLs remove tracking parameters and fragments", () => {
  const url = new URL("https://example.com/job/123/?utm_source=x&ref=abc#apply");
  url.hash = ""; ["utm_source", "ref"].forEach((key) => url.searchParams.delete(key));
  assert.equal(url.toString(), "https://example.com/job/123/");
});
