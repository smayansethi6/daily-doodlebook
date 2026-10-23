import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  InkBusyError,
  InkUnavailableError,
  sendInkMessage,
  type InkMessage,
} from "@/lib/geminiChat";
import type { Question } from "@/lib/questions";

const STARTER_PROMPTS = [
  "Help me see the strongest objection",
  "Clarify a term",
  "Help me structure a reply",
];

const UNAVAILABLE_MESSAGE = "Ink is not switched on for this site yet.";

export interface SteelmanRequest {
  excerpt: string;
  nonce: number;
}

interface InkPanelProps {
  question?: Question;
  hasTodayResponse: boolean;
  steelmanRequest?: SteelmanRequest;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  /** Shown to the visitor but not part of the conversation sent to the model. */
  local?: boolean;
}

function buildWelcome(question?: Question, hasTodayResponse?: boolean) {
  if (!question) {
    return "I can help you reflect, brainstorm, or shape a response once today's question is loaded.";
  }

  return hasTodayResponse
    ? `Your reflection is in for today. If you want, I can help you revisit "${question.question}" from a fresh angle.`
    : `I can help you think through today's question: "${question.question}" Ask for ideas, structure, or a gentler first sentence.`;
}

export default function InkPanel({
  question,
  hasTodayResponse,
  steelmanRequest,
}: InkPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: buildWelcome(question, hasTodayResponse), local: true },
  ]);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const steelmanContext = useRef<string | undefined>();
  const messageListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([
      { id: "welcome", role: "assistant", content: buildWelcome(question, hasTodayResponse), local: true },
    ]);
    // Keyed on the question's identity: a refetch returning the same question
    // must not wipe a conversation in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, hasTodayResponse]);

  // Scroll the list itself: scrollIntoView would drag the whole page down and
  // push the question out of view on load.
  useEffect(() => {
    const list = messageListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, isOpen]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const history: InkMessage[] = [
        ...messagesRef.current
          .filter((message) => !message.local)
          .map(({ role, content }) => ({ role, content })),
        { role: "user", content: trimmed },
      ];
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-user`, role: "user", content: trimmed },
      ]);
      setInput("");
      setIsSending(true);

      try {
        const reply = await sendInkMessage(
          { question, hasTodayResponse, otherSideExcerpt: steelmanContext.current },
          history
        );

        setMessages((current) => [
          ...current,
          {
            id: `${Date.now()}-assistant`,
            role: "assistant",
            content:
              reply || "I need a little more detail to help well. Tell me what part feels stuck.",
          },
        ]);
      } catch (error) {
        console.error("Ink chat failed", error);
        setMessages((current) => [
          ...current,
          {
            id: `${Date.now()}-assistant-error`,
            role: "assistant",
            content:
              error instanceof InkUnavailableError
                ? UNAVAILABLE_MESSAGE
                : error instanceof InkBusyError
                  ? "Lots of people are talking to Ink right now. Try again in a minute."
                  : "Ink could not reach the model just now. Try again in a moment.",
            local: true,
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, question, hasTodayResponse]
  );

  useEffect(() => {
    if (!steelmanRequest) return;

    steelmanContext.current = steelmanRequest.excerpt;
    setIsOpen(true);
    void send(
      `Make the strongest possible case for this reflection from someone who disagreed with me: "${steelmanRequest.excerpt}"`
    );
    // `send` is intentionally excluded: a new identity must not re-fire the handoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steelmanRequest?.nonce]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center gap-3 border-2 border-foreground bg-card px-4 py-3 text-left shadow-[4px_4px_0_hsl(var(--foreground)/0.12)] hover:bg-primary/10 lg:hidden"
      >
        <Sparkles className="h-4 w-4 shrink-0" />
        <span>
          <span className="block text-mono text-[11px] uppercase tracking-[0.12em] text-foreground/70">
            Need a nudge?
          </span>
          <span className="block text-[14px] font-semibold text-foreground">Open Ink</span>
        </span>
      </button>

      <aside
        aria-label="Ink, a writing companion"
        className={cn(
          "flex-col border-2 border-foreground bg-card lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100vh-3rem)]",
          isOpen ? "fixed inset-0 z-50 flex lg:static lg:z-auto" : "hidden"
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-foreground/20 px-4 py-4">
          <div>
            <p className="text-mono text-[11px] uppercase tracking-[0.2em] text-foreground/70">
              Reflection chat
            </p>
            <h3 className="mt-1 text-editorial text-2xl font-bold text-foreground">Ink</h3>
            <p className="mt-1 text-[13px] leading-5 text-foreground/70">
              An AI writing companion for today&apos;s question.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close Ink"
            className="shrink-0 border border-foreground/20 bg-background p-2 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={messageListRef}
          className="flex-1 space-y-3 overflow-y-auto bg-background/60 px-4 py-4 lg:min-h-[18rem]"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[90%] border px-3 py-2 text-[14px] leading-6",
                message.role === "assistant"
                  ? "border-foreground/15 bg-card text-foreground"
                  : "ml-auto border-foreground/30 bg-primary/15 text-foreground"
              )}
            >
              <p className="mb-1 text-mono text-[11px] uppercase tracking-[0.12em] text-foreground/70">
                {message.role === "assistant" ? "Ink" : "You"}
              </p>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}

          {isSending && (
            <p className="border border-foreground/15 bg-card px-3 py-2 text-[14px] text-foreground/70">
              Ink is thinking…
            </p>
          )}
        </div>

        <div className="border-t border-foreground/20 p-4">
          {messages.length === 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void send(prompt)}
                  className="border border-foreground/30 bg-background px-3 py-2 text-[12px] text-foreground hover:bg-foreground/5"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask for ideas, clarity, or structure…"
              className="rounded-none border-foreground/25 bg-background"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={() => void send(input)}
              disabled={!input.trim() || isSending}
              aria-label="Send"
              className="border-2 border-foreground bg-secondary px-3 py-2 text-secondary-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
