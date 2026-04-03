import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, Send } from "lucide-react";

interface QuestionCardProps {
  question: string;
  category: string;
  issue: string;
  index: number;
}

const ROTATIONS = ["-1.5deg", "0.8deg", "-0.5deg", "1.2deg", "-0.8deg"];
const ACCENTS = [
  "border-l-ochre",
  "border-l-rust",
  "border-l-sage",
  "border-l-secondary",
  "border-l-ochre",
];

export default function QuestionCard({ question, category, issue, index }: QuestionCardProps) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const rotation = ROTATIONS[index % ROTATIONS.length];
  const accentClass = ACCENTS[index % ACCENTS.length];

  const handleSubmit = () => {
    if (!answer.trim()) return;
    const key = `answer-${new Date().toDateString()}-${index}`;
    localStorage.setItem(key, answer);
    setSubmitted(true);
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSubmitted(false); setAnswer(""); }}
        className={`group relative w-full text-left border-l-4 ${accentClass} bg-card p-6 md:p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer animate-float-in`}
        style={{
          animationDelay: `${index * 120}ms`,
          transform: `rotate(${rotation})`,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <span className="text-mono text-xs tracking-widest uppercase text-muted-foreground">
            {category}
          </span>
          <span className="text-mono text-[10px] text-muted-foreground opacity-60">
            {issue}
          </span>
        </div>
        <h3 className="text-editorial text-lg md:text-xl lg:text-2xl font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
          {question}
        </h3>
        <div className="mt-4 flex items-center gap-2 text-mono text-xs text-muted-foreground group-hover:text-primary transition-colors">
          <span>→ respond</span>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-2 border-foreground max-w-lg">
          <DialogHeader>
            <div className="text-mono text-xs tracking-widest uppercase text-muted-foreground mb-2">
              {category}
            </div>
            <DialogTitle className="text-editorial text-xl md:text-2xl font-bold leading-snug">
              {question}
            </DialogTitle>
          </DialogHeader>

          {!submitted ? (
            <div className="space-y-4 mt-4">
              <Textarea
                placeholder="Write your thoughts here..."
                className="min-h-[160px] bg-background border-border font-body text-sm resize-none focus:ring-primary"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={2000}
              />
              <div className="flex items-center justify-between">
                <span className="text-mono text-[10px] text-muted-foreground">
                  {answer.length}/2000
                </span>
                <Button
                  onClick={handleSubmit}
                  disabled={!answer.trim()}
                  className="bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground font-mono text-xs tracking-wider uppercase gap-2"
                >
                  <Send className="w-3 h-3" />
                  Submit Entry
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 gap-4 animate-stamp">
              <div className="w-16 h-16 rounded-full bg-sage flex items-center justify-center">
                <Check className="w-8 h-8 text-cream" />
              </div>
              <p className="text-editorial text-lg font-bold text-foreground">
                Entry recorded.
              </p>
              <p className="text-mono text-xs text-muted-foreground text-center">
                Your reflection has been saved to today's issue.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
