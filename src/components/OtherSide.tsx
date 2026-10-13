import { useCallback, useEffect, useState } from "react";
import { Flag, RefreshCw, Sparkles } from "lucide-react";
import { fetchOtherSide, reportResponse, type Question } from "@/lib/questions";
import { pickSeedReflections, type StanceValue } from "@/lib/stance";

const MAX_REFLECTIONS = 3;

interface ShownReflection {
  id: string;
  excerpt: string;
  isSeed: boolean;
}

interface ReflectionSlotProps {
  questionId: string;
  opposingSign: -1 | 1;
  ownResponseId?: string;
  onSteelman: (excerpt: string) => void;
}

function sideLabel(sign: -1 | 1) {
  return sign === -1 ? "Disagree" : "Agree";
}

function ReflectionSlot({
  questionId,
  opposingSign,
  ownResponseId,
  onSteelman,
}: ReflectionSlotProps) {
  const [current, setCurrent] = useState<ShownReflection | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reported, setReported] = useState(false);

  const load = useCallback(
    async (exclude: string[]) => {
      setIsLoading(true);

      const excludeIds = ownResponseId ? [...exclude, ownResponseId] : exclude;

      try {
        const reflection = await fetchOtherSide(questionId, opposingSign, excludeIds);
        if (reflection) {
          setCurrent({ id: reflection.id, excerpt: reflection.excerpt, isSeed: false });
          return;
        }
      } catch (error) {
        console.error("Unable to load an opposing reflection", error);
      } finally {
        setIsLoading(false);
      }

      const seed = pickSeedReflections(opposingSign, exclude);
      setCurrent(seed ? { id: seed.id, excerpt: seed.excerpt, isSeed: true } : null);
    },
    [questionId, opposingSign, ownResponseId]
  );

  useEffect(() => {
    void load([]);
  }, [load]);

  const handleShowAnother = () => {
    if (!current) return;
    setReported(false);
    const nextSeen = [...seen, current.id];
    setSeen(nextSeen);
    void load(nextSeen);
  };

  const handleReport = async () => {
    if (!current) return;
    setReported(true);
    if (!current.isSeed) {
      try {
        await reportResponse(current.id);
      } catch (error) {
        console.error("Unable to report this reflection", error);
      }
    }
    const nextSeen = [...seen, current.id];
    setSeen(nextSeen);
    void load(nextSeen);
  };

  const canShowAnother = seen.length + 1 < MAX_REFLECTIONS;

  if (isLoading && !current) {
    return (
      <div className="border-l-4 border-foreground/30 bg-background/60 px-4 py-4">
        <div className="h-3 w-40 animate-pulse bg-foreground/10" />
        <div className="mt-3 h-4 w-full animate-pulse bg-foreground/10" />
        <div className="mt-2 h-4 w-4/5 animate-pulse bg-foreground/10" />
      </div>
    );
  }

  if (!current) {
    return (
      <p className="border-l-4 border-foreground/20 bg-background/60 px-4 py-4 text-[13px] leading-6 text-foreground/70">
        Nobody from the {sideLabel(opposingSign).toLowerCase()} side has shared a reflection on this
        question yet. Check back tomorrow — the map fills in as the day goes on.
      </p>
    );
  }

  return (
    <div className="border-l-4 border-foreground/40 bg-background/60 px-4 py-4">
      <p className="text-mono text-[11px] uppercase tracking-[0.2em] text-foreground/70">
        From the other side · {sideLabel(opposingSign)}
        {current.isSeed ? " · written by the ThinkPhil team" : ""}
      </p>

      <blockquote className="mt-3 text-editorial text-lg italic leading-relaxed text-foreground">
        &ldquo;{current.excerpt}&rdquo;
      </blockquote>

      {reported && (
        <p className="mt-3 text-[12px] text-foreground/70">
          Thank you — that reflection is hidden from everyone while the team reviews it.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSteelman(current.excerpt)}
          className="inline-flex items-center gap-2 border border-foreground/40 bg-card px-3 py-2 text-mono text-[11px] uppercase tracking-[0.12em] text-foreground hover:bg-foreground/5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask Ink to steelman this
        </button>

        {canShowAnother && (
          <button
            type="button"
            onClick={handleShowAnother}
            disabled={isLoading}
            className="inline-flex items-center gap-2 border border-foreground/40 bg-card px-3 py-2 text-mono text-[11px] uppercase tracking-[0.12em] text-foreground hover:bg-foreground/5 disabled:opacity-60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Show another
          </button>
        )}

        {!current.isSeed && !reported && (
          <button
            type="button"
            onClick={() => void handleReport()}
            className="inline-flex items-center gap-2 border border-transparent px-2 py-2 text-mono text-[11px] uppercase tracking-[0.12em] text-foreground/70 hover:text-destructive"
          >
            <Flag className="h-3.5 w-3.5" />
            Report
          </button>
        )}
      </div>
    </div>
  );
}

interface OtherSideProps {
  question: Question;
  yourStance: StanceValue | null;
  ownResponseId?: string;
  onSteelman: (excerpt: string) => void;
}

export default function OtherSide({
  question,
  yourStance,
  ownResponseId,
  onSteelman,
}: OtherSideProps) {
  // Unsure visitors, and those who skipped the scale, meet both halves.
  const sides: (-1 | 1)[] =
    yourStance === null || yourStance === 0 ? [-1, 1] : yourStance > 0 ? [-1] : [1];

  return (
    <section className="space-y-4">
      <h3 className="text-editorial text-2xl font-bold tracking-tight text-foreground">
        {sides.length > 1 ? "Two other minds" : "Someone who disagreed"}
      </h3>

      {sides.map((sign) => (
        <ReflectionSlot
          key={sign}
          questionId={question.id}
          opposingSign={sign}
          ownResponseId={ownResponseId}
          onSteelman={onSteelman}
        />
      ))}
    </section>
  );
}
