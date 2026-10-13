import { Link } from "react-router-dom";
import { RESET_LABEL } from "@/lib/time";

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t-2 border-foreground">
      <div className="container mx-auto flex w-full max-w-6xl flex-col items-start gap-3 px-4 py-6 md:flex-row md:items-center md:justify-between">
        <p className="text-mono text-[11px] uppercase tracking-[0.12em] text-foreground/70">
          New question every day at {RESET_LABEL}
        </p>
        <div className="flex items-center gap-4">
          <Link
            to="/about"
            className="text-mono text-[11px] uppercase tracking-[0.12em] text-foreground/70 underline underline-offset-4 hover:text-foreground"
          >
            About ThinkPhil
          </Link>
          <p className="text-editorial text-sm italic text-foreground/70">
            Think deeply. Write honestly.
          </p>
        </div>
      </div>
    </footer>
  );
}
