import { getDailyQuestions, getTodayDateString, getIssueNumber } from "@/lib/questions";
import QuestionCard from "@/components/QuestionCard";

const Index = () => {
  const questions = getDailyQuestions(5);
  const today = getTodayDateString();
  const issueNum = getIssueNumber();

  return (
    <div className="min-h-screen bg-background">
      {/* Masthead */}
      <header className="border-b-2 border-foreground">
        <div className="container max-w-4xl mx-auto px-4 py-6 md:py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-editorial text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none text-foreground">
                INQUIRY
              </h1>
              <p className="text-mono text-xs md:text-sm tracking-widest uppercase text-muted-foreground mt-1">
                A daily exercise in thinking
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-mono text-[10px] md:text-xs tracking-widest uppercase text-muted-foreground">
                Issue No. {issueNum}
              </div>
              <div className="text-mono text-[10px] md:text-xs text-muted-foreground mt-0.5">
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
            Today's Questions
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-6">
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q.question}
              category={q.category}
              issue={q.issue}
              index={i}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-foreground mt-12">
        <div className="container max-w-4xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            New questions every day at midnight
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
