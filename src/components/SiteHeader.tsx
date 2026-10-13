import { Link } from "react-router-dom";
import { getTodayDateLabel } from "@/lib/time";

interface SiteHeaderProps {
  /** Shown instead of the "My responses" link on the responses page itself. */
  action?: { to: string; label: string };
}

export default function SiteHeader({
  action = { to: "/responses", label: "My responses" },
}: SiteHeaderProps) {
  return (
    <header className="border-b-2 border-foreground">
      <div className="container mx-auto w-full max-w-6xl px-4 py-5 md:py-7">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <Link
              to="/"
              className="text-editorial block text-3xl font-black leading-none tracking-tight text-foreground sm:text-4xl md:text-5xl"
            >
              ThinkPhil<span className="text-[hsl(var(--ochre-deep))]">.</span>
            </Link>
            <p className="text-mono mt-1 text-[11px] uppercase tracking-[0.12em] text-foreground/70">
              One question a day
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
            <Link
              to={action.to}
              className="text-mono inline-flex items-center whitespace-nowrap border border-foreground/40 bg-card px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-foreground transition hover:bg-foreground/5"
            >
              {action.label}
            </Link>
            <p className="text-mono text-[11px] text-foreground/70">{getTodayDateLabel()}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
