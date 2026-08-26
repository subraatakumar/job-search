"use client";
import { useState } from "react";
import countries from "@/data/countries.json";

type Country = { code: string; name: string };
export default function CountryPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const selected = value.split(",").map((item) => item.trim()).filter(Boolean);
  const options = (countries as Country[]).filter((country) => country.name.toLowerCase().includes(query.toLowerCase()) && !selected.includes(country.name)).slice(0, 8);
  function add(country: string) { onChange([...selected, country].join(", ")); setQuery(""); }
  function remove(country: string) { onChange(selected.filter((item) => item !== country).join(", ")); }
  return <div className="country-picker"><div className="country-chips">{selected.map((country) => <span className="country-chip" key={country}>{country}<button type="button" aria-label={`Remove ${country}`} onClick={() => remove(country)}>×</button></span>)}{!selected.length && <span className="country-empty">No countries selected yet</span>}</div><input value={query} placeholder="Search countries to add…" onChange={(event) => setQuery(event.target.value)} />{query && <div className="country-options">{options.length ? options.map((country) => <button type="button" key={country.code} onClick={() => add(country.name)}>{country.name}<span>＋</span></button>) : <span>No matching countries</span>}</div>}</div>;
}
