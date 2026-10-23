import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useTodayKey } from "@/hooks/use-today";

function Today() {
  return <p>{useTodayKey()}</p>;
}

describe("useTodayKey", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves to the next day at 00:00 GST without a reload", () => {
    // 23:59:45 in Dubai (UTC+4).
    vi.setSystemTime(new Date("2026-10-17T19:59:45Z"));
    render(<Today />);
    expect(screen.getByText("2026-10-17")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByText("2026-10-18")).toBeInTheDocument();
  });

  it("catches up when a sleeping tab is shown again", () => {
    vi.setSystemTime(new Date("2026-10-17T12:00:00Z"));
    render(<Today />);
    expect(screen.getByText("2026-10-17")).toBeInTheDocument();

    // Timers did not run while asleep; only the clock moved on.
    vi.setSystemTime(new Date("2026-10-18T06:00:00Z"));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(screen.getByText("2026-10-18")).toBeInTheDocument();
  });
});
