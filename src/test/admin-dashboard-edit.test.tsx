import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import AdminDashboard from "@/pages/AdminDashboard";

vi.mock("@/lib/admin", () => {
  return {
    fetchQuestions: vi.fn(async () => [
      { id: "1", question: "What is your favorite color?", category: "Icebreakers" },
    ]),
    fetchResponses: vi.fn(async () => []),
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    deleteQuestion: vi.fn(),
  };
});

vi.mock("recharts", () => {
  const Stub = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Bar: Stub,
    BarChart: Stub,
    Cell: Stub,
    Pie: Stub,
    PieChart: Stub,
    ResponsiveContainer: Stub,
    Tooltip: Stub,
    XAxis: Stub,
  };
});

function renderAdmin() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AdminDashboard edit flow", () => {
  it("opens and closes the edit panel when clicking Edit", async () => {
    const user = userEvent.setup();
    renderAdmin();

    await screen.findByText("What is your favorite color?");

    const editButton = screen.getByRole("button", { name: "Edit" });
    await user.click(editButton);

    expect(await screen.findByText("Editing")).toBeInTheDocument();
    expect(screen.getByDisplayValue("What is your favorite color?")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Icebreakers")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editing…" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Editing…" }));
    expect(screen.queryByText("Editing")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});
