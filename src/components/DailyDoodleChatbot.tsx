import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import type { Chat } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createReflectionChatSession, hasGeminiConfig } from "@/lib/geminiChat";
import type { Question } from "@/lib/questions";

interface DailyDoodleChatbotProps {
  question?: Question;
  hasTodayResponse: boolean;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

function buildWelcomeMessage(question?: Question, hasTodayResponse?: boolean) {
  if (question) {
    return hasTodayResponse
      ? `Your reflection is already in for today. If you want, I can help you revisit "${question.question}" from a fresh angle.`
      : `I can help you think through today's prompt: "${question.question}" Try asking for ideas, structure, or a gentler first sentence.`;
  }

  return "I can help you reflect, brainstorm, or shape a response once today's question is loaded.";
}

export default function DailyDoodleChatbot({
  question,
  hasTodayResponse,
}: DailyDoodleChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: buildWelcomeMessage(question, hasTodayResponse),
    },
  ]);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatRef.current = null;
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: buildWelcomeMessage(question, hasTodayResponse),
      },
    ]);
  }, [question?.id, hasTodayResponse]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const missingConfigMessage =
    "Add VITE_GEMINI_API_KEY in .env to enable Gemini chat.";

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");

    if (!hasGeminiConfig) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant-config`,
          role: "assistant",
          content: missingConfigMessage,
        },
      ]);
      return;
    }

    setIsSending(true);

    try {
      if (!chatRef.current) {
        chatRef.current = createReflectionChatSession(question, hasTodayResponse);
      }

      const result = await chatRef.current.sendMessage({ message: trimmed });
      const text = result.text?.trim();

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: text || "I need a little more detail to help well. Tell me what part feels stuck.",
        },
      ]);
    } catch (error) {
      console.error("Gemini chat failed", error);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant-error`,
          role: "assistant",
          content:
            "The reflection guide could not reach Gemini right now. Double-check the Gemini API key and try again.",
        },
      ]);
      chatRef.current = null;
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-16 right-4 z-50 flex items-end justify-end">
      {isOpen ? (
        <div className="w-[calc(100vw-2rem)] max-w-sm overflow-hidden border-2 border-foreground bg-card shadow-[10px_10px_0_hsl(var(--foreground)/0.14)]">
          <div className="border-b border-foreground/20 bg-gradient-to-br from-primary/20 via-background to-card px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                  Reflection Chat
                </p>
                <h3 className="mt-1 text-editorial text-2xl font-bold text-foreground">
                  Ink
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  A Gemini-powered writing companion for today&apos;s page.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-none border border-foreground/15 bg-background/60"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[24rem] bg-background/70 px-4 py-4">
            <div className="space-y-3 pr-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[88%] border px-3 py-2 text-sm leading-6 shadow-sm",
                    message.role === "assistant"
                      ? "border-foreground/15 bg-card text-foreground"
                      : "ml-auto border-primary/30 bg-primary/12 text-foreground"
                  )}
                >
                  <p className="mb-1 text-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    {message.role === "assistant" ? "Ink" : "You"}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}

              {isSending && (
                <div className="max-w-[88%] border border-foreground/15 bg-card px-3 py-2 text-sm text-muted-foreground">
                  Ink is thinking...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-foreground/15 bg-card p-4">
            {!hasGeminiConfig && (
              <p className="mb-3 text-[11px] leading-5 text-muted-foreground">
                {missingConfigMessage}
              </p>
            )}

            <div className="flex items-end gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Ask for ideas, clarity, or structure..."
                className="rounded-none border-foreground/20 bg-background"
                disabled={isSending}
              />
              <Button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim() || isSending}
                className="rounded-none bg-secondary px-3 text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-auto rounded-none border-2 border-foreground bg-card px-4 py-3 text-left shadow-[8px_8px_0_hsl(var(--foreground)/0.12)] hover:bg-primary/15"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/20 bg-background">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="flex flex-col items-start">
              <span className="text-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                Need a nudge?
              </span>
              <span className="text-sm font-semibold text-foreground">
                Open reflection chat
              </span>
            </span>
            <MessageCircle className="h-4 w-4 shrink-0" />
          </span>
        </Button>
      )}
    </div>
  );
}
