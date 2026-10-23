import { useEffect, useState } from "react";
import { getTodayDateKey } from "@/lib/time";

const CHECK_INTERVAL_MS = 30_000;

/**
 * Today's Dubai date key, kept current across the 00:00 GST reset so a tab left
 * open moves on to the new day's question. Timers are throttled in background
 * tabs and stop while a laptop sleeps, so the date is also re-checked whenever
 * the page is shown or focused again.
 */
export function useTodayKey(): string {
  const [today, setToday] = useState(getTodayDateKey);

  useEffect(() => {
    const sync = () => setToday(getTodayDateKey());
    const timer = window.setInterval(sync, CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return today;
}
