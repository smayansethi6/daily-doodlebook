import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AnswerComposer from "@/components/AnswerComposer";
import InkPanel, { type SteelmanRequest } from "@/components/InkPanel";
import PostAnswerState from "@/components/PostAnswerState";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { fetchDailyQuestion, type DailyQuestion } from "@/lib/questions";
import {
  getTodayEntry,
  RESPONSE_HISTORY_EVENT,
  type LocalResponseEntry,
} from "@/lib/localResponses";
import { getTodayDateKey } from "@/lib/time";

const QuestionSkeleton = () => (
  <div className="space-y-4" aria-hidden>
    <div className="h-4 w-32 animate-pulse bg-foreground/10" />
    <div className="h-10 w-full animate-pulse bg-foreground/10" />
    <div className="h-10 w-4/5 animate-pulse bg-foreground/10" />
    <div className="h-48 w-full animate-pulse bg-foreground/5" />
  </div>
);

const Index = () => {
  const queryClient = useQueryClient();
  const [todayEntry, setTodayEntry] = useState<LocalResponseEntry | undefined>();
  const [steelmanRequest, setSteelmanRequest] = useState<SteelmanRequest>();

  const { data, isLoading, refetch, isFetching } = useQuery<DailyQuestion>({
    queryKey: ["daily-question", getTodayDateKey()],
    queryFn: fetchDailyQuestion,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const update = () => setTodayEntry(getTodayEntry());
    update();
    window.addEventListener(RESPONSE_HISTORY_EVENT, update);
    return () => window.removeEventListener(RESPONSE_HISTORY_EVENT, update);
  }, []);

  const handleSteelman = useCallback((excerpt: string) => {
    setSteelmanRequest({ excerpt, nonce: Date.now() });
  }, []);

  const question = data?.question;
  const isDegraded = data?.source === "stale" || data?.source === "fallback";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="container mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-8">
            {isLoading && <QuestionSkeleton />}

            {question && (
              <>
                <section className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="h-3 w-3 rotate-45 bg-primary" />
                    <p className="text-mono text-[11px] uppercase tracking-[0.2em] text-foreground/70">
                      Today&apos;s question · {question.category}
                    </p>
                  </div>

                  <h2 className="text-editorial text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl">
                    {question.question}
                  </h2>

                  {isDegraded && (
                    <div className="flex flex-wrap items-center gap-3 border border-foreground/20 bg-card/60 px-4 py-3">
                      <p className="text-[13px] leading-5 text-foreground/70">
                        {data?.source === "stale"
                          ? "Showing the last question saved on this device — we could not reach ThinkPhil just now."
                          : "We could not reach today's question, so here is ThinkPhil's standby one."}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          queryClient.removeQueries({ queryKey: ["daily-question"] });
                          void refetch();
                        }}
                        disabled={isFetching}
                        className="border border-foreground/40 bg-card px-3 py-2 text-mono text-[11px] uppercase tracking-[0.12em] text-foreground hover:bg-foreground/5 disabled:opacity-60"
                      >
                        {isFetching ? "Trying…" : "Try again"}
                      </button>
                    </div>
                  )}
                </section>

                {todayEntry ? (
                  <PostAnswerState
                    question={question}
                    entry={todayEntry}
                    onSteelman={handleSteelman}
                  />
                ) : (
                  <AnswerComposer
                    question={question}
                    onSubmitted={() => setTodayEntry(getTodayEntry())}
                  />
                )}
              </>
            )}
          </div>

          <InkPanel
            question={question}
            hasTodayResponse={Boolean(todayEntry)}
            steelmanRequest={steelmanRequest}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
