import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchResponsesByIds } from "@/lib/questions";
import { loadLocalResponseIds, RESPONSE_HISTORY_EVENT } from "@/lib/localResponses";

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "";

const ResponsesPage = () => {
  const [ids, setIds] = useState<string[]>([]);

  const loadIds = () => {
    const values = loadLocalResponseIds();
    setIds(values);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    loadIds();
    const handler = () => loadIds();
    window.addEventListener(RESPONSE_HISTORY_EVENT, handler);
    return () => window.removeEventListener(RESPONSE_HISTORY_EVENT, handler);
  }, []);

  const queryEnabled = ids.length > 0;
  const responsesQuery = useQuery({
    queryKey: ["responses", ids],
    queryFn: () => fetchResponsesByIds(ids),
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 5,
  });

  const [categoryFilter, setCategoryFilter] = useState("");
  const responses = useMemo(() => responsesQuery.data ?? [], [responsesQuery.data]);
  const categories = useMemo(() => {
    const set = new Set<string>();
    responses.forEach((entry) => set.add(entry.category));
    return Array.from(set).sort();
  }, [responses]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground">
        <div className="container max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <p className="text-editorial text-xs tracking-tight uppercase text-muted-foreground">
              My Responses
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Reflection history</h1>
          </div>
          <Link
            to="/"
            className="inline-flex h-12 w-32 items-center justify-center rounded-md border border-foreground/40 bg-card text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground hover:bg-foreground/5 transition"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        {!queryEnabled && (
          <p className="text-sm text-muted-foreground">
            No IDs stored locally yet. Submit one reflection to begin tracking it.
          </p>
        )}

        {responsesQuery.isLoading && queryEnabled && (
          <p className="text-sm text-muted-foreground">Loading your saved responses…</p>
        )}

        {responses.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-none border border-border px-3 py-2 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-[460px] overflow-y-auto rounded-none border border-border bg-card px-6 py-6 space-y-6 shadow-sm">
              {(categoryFilter ? responses.filter((entry) => entry.category === categoryFilter) : responses).map(
                (entry) => (
                  <div key={entry.id} className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] tracking-tight text-muted-foreground">
                      <span className="text-mono uppercase">{entry.category}</span>
                      <span className="text-mono">{formatDate(entry.created_at)}</span>
                    </div>
                    <p className="text-editorial text-2xl leading-tight text-foreground tracking-tight">
                      {entry.question.question}
                    </p>
                    <p className="text-editorial text-sm leading-snug text-muted-foreground tracking-tight">
                      {entry.response}
                    </p>
                    <div className="h-px bg-border" />
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {responsesQuery.isError && (
          <p className="text-sm text-destructive">
            Unable to load responses from Supabase. Please try again.
          </p>
        )}
      </main>
    </div>
  );
};

export default ResponsesPage;
