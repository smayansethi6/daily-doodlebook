import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import StanceScale from "@/components/StanceScale";
import {
  isFallbackQuestion,
  submitResponse,
  type Question,
} from "@/lib/questions";
import { clearDraft, loadDraft, persistLocalResponse, saveDraft } from "@/lib/localResponses";
import { screenReflection } from "@/lib/moderation";
import { stanceEnabled, type StanceValue } from "@/lib/stance";

const MAX_LENGTH = 2000;
const DRAFT_DEBOUNCE_MS = 600;

interface AnswerComposerProps {
  question: Question;
  onSubmitted: () => void;
}

export default function AnswerComposer({ question, onSubmitted }: AnswerComposerProps) {
  const [answer, setAnswer] = useState(() => loadDraft());
  const [stance, setStance] = useState<StanceValue | null>(null);
  const [shareConsent, setShareConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const draftTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => saveDraft(answer), DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(draftTimer.current);
  }, [answer]);

  const offline = isFallbackQuestion(question);
  const showStance = stanceEnabled(question) && !offline;

  const handleSubmit = async () => {
    const trimmed = answer.trim();
    if (!trimmed || isSaving) return;

    setIsSaving(true);
    setSaveError("");

    try {
      // The standby question has no row to reference, so it stays on this device.
      let record: { id: string; created_at: string };

      if (offline) {
        record = { id: crypto.randomUUID(), created_at: new Date().toISOString() };
      } else {
        const verdict = shareConsent
          ? await screenReflection(trimmed)
          : { status: "pending" as const, reason: undefined };

        record = await submitResponse({
          questionId: question.id,
          category: question.category,
          response: trimmed,
          stance: showStance ? stance : null,
          shareConsent,
          moderationStatus: verdict.status,
          moderationReason: verdict.reason,
        });
      }

      persistLocalResponse({
        id: record.id,
        createdAt: record.created_at ?? new Date().toISOString(),
        questionId: question.id,
        category: question.category,
        question: question.question,
        response: trimmed,
        stance: showStance ? stance : null,
        shareConsent,
      });

      clearDraft();
      onSubmitted();
    } catch (error) {
      console.error("Failed to save response", error);
      setSaveError(
        "Your reflection could not be saved just now. Your words are still here — try again in a moment."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {showStance && <StanceScale question={question} value={stance} onChange={setStance} />}

      <div>
        <label htmlFor="reflection" className="sr-only">
          Your reflection
        </label>
        <Textarea
          id="reflection"
          placeholder="Write what comes…"
          className="min-h-[220px] resize-y rounded-none border-2 border-foreground/25 bg-card p-4 text-base leading-7 focus-visible:border-foreground focus-visible:ring-0"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          maxLength={MAX_LENGTH}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 border border-foreground/20 bg-card/60 p-4">
        <input
          type="checkbox"
          checked={shareConsent}
          onChange={(event) => setShareConsent(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--foreground))]"
        />
        <span>
          <span className="block text-[14px] font-medium text-foreground">
            Let others read this anonymously
          </span>
          <span className="mt-1 block text-[12px] leading-5 text-foreground/70">
            Off by default. If you tick it, your words may be shown to someone who answered
            differently — never your name, time or location, and only after a human has reviewed it.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-mono text-[11px] tracking-[0.12em] text-foreground/70">
          {answer.length}/{MAX_LENGTH} · drafts are kept on this device
        </span>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!answer.trim() || isSaving}
          className="inline-flex items-center gap-2 border-2 border-foreground bg-secondary px-5 py-3 text-mono text-[11px] uppercase tracking-[0.12em] text-secondary-foreground shadow-[4px_4px_0_hsl(var(--foreground)/0.25)] transition hover:bg-primary hover:text-primary-foreground disabled:opacity-50 disabled:shadow-none"
        >
          <Send className="h-3.5 w-3.5" />
          {isSaving ? "Saving…" : "Submit reflection"}
        </button>
      </div>

      {offline && (
        <p className="text-[12px] leading-5 text-foreground/70">
          You&apos;re writing against ThinkPhil&apos;s standby question because today&apos;s could
          not be reached. Your reflection will be kept on this device.
        </p>
      )}

      {saveError && <p className="text-[13px] text-destructive">{saveError}</p>}
    </div>
  );
}
