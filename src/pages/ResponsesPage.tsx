import { useEffect, useMemo, useState } from "react";
import { Copy, Download } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { toast } from "@/components/ui/sonner";
import {
  exportHistoryAsText,
  loadLocalResponseHistory,
  RESPONSE_HISTORY_EVENT,
  type LocalResponseEntry,
} from "@/lib/localResponses";
import { STANCE_LABELS, type StanceValue } from "@/lib/stance";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

const ResponsesPage = () => {
  const [entries, setEntries] = useState<LocalResponseEntry[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    const load = () => setEntries(loadLocalResponseHistory());
    load();
    window.addEventListener(RESPONSE_HISTORY_EVENT, load);
    return () => window.removeEventListener(RESPONSE_HISTORY_EVENT, load);
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.category))).sort(),
    [entries]
  );

  const visible = categoryFilter
    ? entries.filter((entry) => entry.category === categoryFilter)
    : entries;

  const handleDownload = () => {
    const blob = new Blob([exportHistoryAsText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `thinkphil-reflections-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportHistoryAsText());
      toast.success("All your reflections are on the clipboard.");
    } catch (error) {
      console.error("Unable to copy reflections", error);
      toast.error("Your browser would not let us copy. Try the download instead.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader action={{ to: "/", label: "Today's question" }} />

      <main className="container mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
        <div>
          <h1 className="text-editorial text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            My responses
          </h1>
          <p className="mt-2 text-[13px] leading-6 text-foreground/70">
            Your reflections are kept on this device only — ThinkPhil has no accounts, so clearing
            your browser data or opening the site on another phone starts an empty list. Keep a copy
            if they matter to you.
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="border border-foreground/20 bg-card p-6 text-[15px] leading-7 text-foreground">
            Nothing here yet. Answer today&apos;s question and it will appear on this page.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="text-mono inline-flex items-center gap-2 border border-foreground/40 bg-card px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-foreground hover:bg-foreground/5"
              >
                <Download className="h-3.5 w-3.5" />
                Download as text
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="text-mono inline-flex items-center gap-2 border border-foreground/40 bg-card px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-foreground hover:bg-foreground/5"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy all
              </button>

              {categories.length > 1 && (
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="ml-auto border border-foreground/40 bg-card px-3 py-2 text-[13px] text-foreground"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-6">
              {visible.map((entry) => (
                <article key={entry.id} className="border border-foreground/20 bg-card p-5">
                  <div className="text-mono flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.12em] text-foreground/70">
                    <span>{entry.category}</span>
                    <span>{formatDate(entry.createdAt)}</span>
                  </div>
                  <h2 className="text-editorial mt-3 text-xl leading-snug tracking-tight text-foreground">
                    {entry.question}
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-foreground/90">
                    {entry.response}
                  </p>
                  {entry.stance !== null && entry.stance !== undefined && (
                    <p className="text-mono mt-3 text-[11px] uppercase tracking-[0.12em] text-foreground/70">
                      Your stance: {STANCE_LABELS[entry.stance as StanceValue]}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};

export default ResponsesPage;
