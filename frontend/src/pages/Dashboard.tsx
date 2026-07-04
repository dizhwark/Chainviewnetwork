import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Institution,
  InstitutionSearchResult,
  listInstitutions,
  searchInstitutions,
  syncInstitution,
} from "../api/client";
import { useAsync } from "../hooks/useAsync";

export default function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InstitutionSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [syncingCik, setSyncingCik] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: institutions, reload } = useAsync<Institution[]>(listInstitutions, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await searchInstitutions(query.trim());
      setResults(res);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSearching(false);
    }
  }

  async function handleSync(match: InstitutionSearchResult) {
    setSyncingCik(match.cik);
    setError(null);
    try {
      const detail = await syncInstitution(match.cik, match.name);
      await reload();
      navigate(`/institutions/${detail.id}`);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSyncingCik(null);
    }
  }

  return (
    <div className="stack">
      <section className="card">
        <h1>Replicate a 13F portfolio</h1>
        <p className="muted">
          Search SEC EDGAR for an institutional investment manager, pull their latest 13F-HR
          filings, and rebuild their equity portfolio as tradable weights.
        </p>
        <form className="search-row" onSubmit={handleSearch}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Berkshire Hathaway, Renaissance Technologies, Tiger Global"
          />
          <button type="submit" disabled={searching}>
            {searching ? "Searching…" : "Search EDGAR"}
          </button>
        </form>
        {error && <p className="error">{error}</p>}

        {results.length > 0 && (
          <ul className="result-list">
            {results.map((m) => (
              <li key={m.cik}>
                <div>
                  <strong>{m.name}</strong>
                  <span className="muted"> CIK {m.cik}</span>
                </div>
                <button onClick={() => handleSync(m)} disabled={syncingCik === m.cik}>
                  {syncingCik === m.cik ? "Syncing…" : "Sync filings"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Tracked institutions</h2>
        {!institutions?.length && <p className="muted">No institutions synced yet — search above to get started.</p>}
        {!!institutions?.length && (
          <ul className="result-list">
            {institutions.map((inst) => (
              <li key={inst.id}>
                <div>
                  <strong>{inst.name}</strong>
                  <span className="muted"> CIK {inst.cik}</span>
                </div>
                <button onClick={() => navigate(`/institutions/${inst.id}`)}>View portfolio</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function describeError(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  return "Something went wrong. Please try again.";
}
