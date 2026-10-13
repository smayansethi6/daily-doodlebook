import type { Question } from "@/lib/questions";
import { STANCE_VALUES, type StanceValue, endLabels, stanceLabel } from "@/lib/stance";
import { cn } from "@/lib/utils";

interface StanceScaleProps {
  question: Question;
  value: StanceValue | null;
  onChange: (value: StanceValue | null) => void;
}

export default function StanceScale({ question, value, onChange }: StanceScaleProps) {
  const ends = endLabels(question);

  return (
    <fieldset className="border border-foreground/20 bg-card/60 p-4 md:p-5">
      <legend className="px-2 text-mono text-[11px] uppercase tracking-[0.2em] text-foreground/70">
        Where do you stand?
      </legend>

      <div className="grid grid-cols-5 gap-2">
        {STANCE_VALUES.map((stance) => {
          const selected = value === stance;
          return (
            <button
              key={stance}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : stance)}
              className={cn(
                "flex min-h-[4.5rem] items-center justify-center border-2 px-1 py-2 text-center text-[11px] leading-tight transition-colors",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/25 bg-background text-foreground/80 hover:border-foreground/60 hover:bg-foreground/5"
              )}
            >
              {stanceLabel(question, stance)}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-mono text-[11px] tracking-[0.12em] text-foreground/70">
        <span>{ends.low}</span>
        <span className="text-right">{ends.high}</span>
      </div>

      <p className="mt-2 text-[12px] leading-5 text-foreground/70">
        Optional. Your stance is never shown with your words — only as one anonymous mark on the map.
      </p>
    </fieldset>
  );
}
