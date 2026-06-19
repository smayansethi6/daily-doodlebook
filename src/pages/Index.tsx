import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDailyQuestion,
  getTodayDateKey,
  getTodayDateString,
  getIssueNumber,
  Question,
} from "@/lib/questions";
import { hasLocalResponseForDate, RESPONSE_HISTORY_EVENT } from "@/lib/localResponses";
import QuestionCard from "@/components/QuestionCard";

const Index = () => {
  const today = getTodayDateString();
  const issueNum = getIssueNumber();
  const [hasTodayResponse, setHasTodayResponse] = useState(false);
  const { data: question, isLoading, isError } = useQuery<Question | undefined>({
    queryKey: ["daily-question", getTodayDateKey()],
    queryFn: fetchDailyQuestion,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const update = () => setHasTodayResponse(hasLocalResponseForDate(new Date()));
    update();
    window.addEventListener(RESPONSE_HISTORY_EVENT, update);
    return () => window.removeEventListener(RESPONSE_HISTORY_EVENT, update);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Masthead */}
      <header className="border-b-2 border-foreground">
        <div className="container max-w-4xl mx-auto px-4 py-6 md:py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-editorial text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none text-foreground">
                INQUIRY
              </h1>
              <p className="text-mono text-xs md:text-sm tracking-widest uppercase text-muted-foreground mt-1">
                A daily exercise in thinking
              </p>
            </div>
          <div className="text-right shrink-0 flex flex-col items-end gap-2">
            <Link
              to="/responses"
              className="inline-flex h-12 w-32 items-center justify-center rounded-md border border-foreground/30 bg-card text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground hover:bg-foreground/5 transition"
            >
              My responses
            </Link>
            <div className="text-mono text-[10px] md:text-xs text-muted-foreground">
              {today}
            </div>
          </div>
          </div>
        </div>
      </header>

      {/* Editorial intro */}
      <section className="container max-w-4xl mx-auto px-4 py-8 md:py-12 border-b border-border">
        <p className="text-editorial text-lg md:text-xl italic text-muted-foreground max-w-2xl">
          "The unexamined life is not worth living." Today's questions await your reflection.
          Pick one. Sit with it. Write what comes.
        </p>
      </section>

      {/* Questions */}
      <main className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-3 h-3 bg-primary rotate-45" />
          <h2 className="text-mono text-xs tracking-widest uppercase text-muted-foreground">
            Today's Question
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-6">
          {hasTodayResponse ? (
            <div className="rounded-none border border-foreground/20 bg-card p-6">
              <p className="text-editorial text-lg italic tracking-tight text-muted-foreground max-w-2xl">
                Thank you — you already captured today's reflection. The next question will arrive tomorrow.
              </p>
            </div>
          ) : (
            <>
              {isLoading && (
                <p className="text-sm text-muted-foreground">Loading today's question…</p>
              )}
              {isError && (
                <p className="text-sm text-muted-foreground">
                  Unable to load today's question. Please try again in a moment.
                </p>
              )}
              {question && (
                <QuestionCard
                  key={question.id}
                  questionId={question.id}
                  question={question.question}
                  category={question.category}
                  index={0}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-foreground mt-12">
        <div className="container max-w-4xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            New question every day at midnight
          </p>
          <p className="text-editorial text-sm italic text-muted-foreground">
            Think deeply. Write honestly.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
