import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import OtherSide from "@/components/OtherSide";
import StanceDistribution from "@/components/StanceDistribution";
import { fetchStanceCounts, isFallbackQuestion, type Question } from "@/lib/questions";
import type { LocalResponseEntry } from "@/lib/localResponses";
import { getStreak } from "@/lib/localResponses";
import { stanceEnabled, type StanceValue } from "@/lib/stance";
import { formatCountdown, msUntilNextReset, RESET_LABEL } from "@/lib/time";

interface PostAnswerStateProps {
  question: Question;
  entry: LocalResponseEntry;
  onSteelman: (excerpt: string) => void;
}

export default function PostAnswerState({
  question,
  entry,
  onSteelman,
}: PostAnswerStateProps) {
  const [remaining, setRemaining] = useState(() => msUntilNextReset());
  const streak = getStreak();
  const offline = isFallbackQuestion(question);

  useEffect(() => {
    const timer = setInterval(() => setRemaining(msUntilNextReset()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const countsQuery = useQuery({
    queryKey: ["stance-counts", question.id],
    queryFn: () => fetchStanceCounts(question.id),
    enabled: !offline,
  });

  const yourStance = (entry.stance ?? null) as StanceValue | null;
  const showMap = stanceEnabled(question) && !offline;

  return (
    <div className="space-y-8">
      <section className="border-2 border-foreground bg-card p-5 md:p-6 shadow-[6px_6px_0_hsl(var(--foreground)/0.12)]">
        <p className="text-mono text-[11px] uppercase tracking-[0.2em] text-foreground/70">
          What you wrote today
        </p>
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-foreground">
          {entry.response}
        </p>
        <p className="mt-4 text-[12px] leading-5 text-foreground/70">
          {entry.shareConsent
            ? "You chose to let others read this. It joins the pool once a human has reviewed it."
            : "This stays private to you. Only your stance counted towards the map below."}
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-foreground/20 py-4 text-mono text-[11px] uppercase tracking-[0.12em] text-foreground/70">
        <span>Next question in {formatCountdown(remaining)}</span>
        <span>
          Streak: {streak} {streak === 1 ? "day" : "days"}
        </span>
        <Link to="/responses" className="underline underline-offset-4 hover:text-foreground">
          My responses
        </Link>
      </section>

      {showMap && countsQuery.data && (
        <StanceDistribution
          question={question}
          counts={countsQuery.data}
          yourStance={yourStance}
        />
      )}

      {!offline && (
        <OtherSide
          question={question}
          yourStance={yourStance}
          ownResponseId={entry.id}
          onSteelman={onSteelman}
        />
      )}

      <p className="text-[12px] leading-5 text-foreground/70">
        A new question arrives at {RESET_LABEL}.
      </p>
    </div>
  );
}
