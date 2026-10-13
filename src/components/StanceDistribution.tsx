import type { Question, StanceCounts } from "@/lib/questions";
import { STANCE_VALUES, type StanceValue, endLabels, stanceLabel } from "@/lib/stance";
import { cn } from "@/lib/utils";

const MIN_SAMPLE = 20;

// Tints light enough to carry the dark ink percentages at 4.5:1 or better.
const SEGMENT_COLORS = [
  "bg-[hsl(var(--rust)/0.55)]",
  "bg-[hsl(var(--rust)/0.28)]",
  "bg-[hsl(var(--muted-foreground)/0.28)]",
  "bg-[hsl(var(--ochre)/0.45)]",
  "bg-[hsl(var(--sage)/0.5)]",
];

interface StanceDistributionProps {
  question: Question;
  counts: StanceCounts;
  yourStance: StanceValue | null;
}

export default function StanceDistribution({
  question,
  counts,
  yourStance,
}: StanceDistributionProps) {
  const ends = endLabels(question);
  const totalLabel = `${counts.total} ${counts.total === 1 ? "reflection" : "reflections"} today`;

  if (counts.withStance < MIN_SAMPLE) {
    return (
      <div className="border border-foreground/20 bg-card p-5">
        <p className="text-mono text-[11px] uppercase tracking-[0.2em] text-foreground/70">
          Where everyone stands
        </p>
        <p className="mt-3 text-editorial text-xl leading-snug text-foreground">
          You&apos;re among the first {counts.total} to answer today.
        </p>
        <p className="mt-2 text-[13px] leading-6 text-foreground/70">
          The stance map appears once {MIN_SAMPLE} people have placed themselves — too few answers
          make a misleading picture.
        </p>
      </div>
    );
  }

  const percentages = counts.buckets.map((count) =>
    Math.round((count / counts.withStance) * 100)
  );

  return (
    <div className="border border-foreground/20 bg-card p-5">
      <p className="text-mono text-[11px] uppercase tracking-[0.2em] text-foreground/70">
        Where everyone stands
      </p>

      <div className="mt-4 flex h-10 w-full overflow-hidden border border-foreground/30">
        {STANCE_VALUES.map((stance, index) => {
          const percent = percentages[index];
          if (!percent) return null;
          return (
            <div
              key={stance}
              style={{ width: `${percent}%` }}
              title={`${stanceLabel(question, stance)}: ${percent}%`}
              className={cn(
                "flex items-center justify-center border-r border-foreground/15 text-mono text-[11px] text-foreground last:border-r-0",
                SEGMENT_COLORS[index]
              )}
            >
              {percent >= 8 ? `${percent}%` : ""}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-mono text-[11px] tracking-[0.12em] text-foreground/70">
        <span>{ends.low}</span>
        <span className="hidden sm:inline">Unsure</span>
        <span className="text-right">{ends.high}</span>
      </div>

      <p className="mt-3 text-mono text-[11px] tracking-[0.12em] text-foreground/70">
        {yourStance === null
          ? `No stance recorded for you · ${totalLabel}`
          : `▲ You: ${stanceLabel(question, yourStance)} · ${totalLabel}`}
      </p>
    </div>
  );
}
