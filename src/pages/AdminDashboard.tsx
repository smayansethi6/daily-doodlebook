import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  addQuestionSchedule,
  createQuestion,
  deleteQuestion,
  deleteQuestionSchedule,
  fetchQuestionSchedules,
  fetchQuestions,
  fetchResponses,
  updateQuestion,
} from "@/lib/admin";
import { clearAdminSession, getAdminSession } from "@/lib/adminSession";
import { toast } from "@/components/ui/sonner";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  TooltipProps,
} from "recharts";

const COLORS = [
  "#d6c1a3",
  "#f15c79",
  "#6ee7b7",
  "#93c5fd",
  "#f59e0b",
  "#a855f7",
  "#00b0ff",
  "#fb7185",
  "#6366f1",
  "#10b981",
  "#fecaca",
  "#fbbf24",
];

const PieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0].payload as { name: string; value: number };
    return (
      <div className="rounded-none border border-border bg-card px-3 py-2 text-sm shadow-lg">
        <p className="text-editorial text-sm font-semibold tracking-tight text-foreground">{name}</p>
        <p className="text-mono text-xs uppercase tracking-[0.4em] text-muted-foreground">{value} response{value === 1 ? "" : "s"}</p>
      </div>
    );
  }

  return null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"questions" | "schedule" | "responses">("questions");
  const [newQuestion, setNewQuestion] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [scheduleQuestionId, setScheduleQuestionId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const editingPanelRef = useRef<HTMLDivElement | null>(null);
  const [responseFilter, setResponseFilter] = useState({
    category: "",
    search: "",
    from: "",
    to: "",
  });

  useEffect(() => {
    if (!editingId) return;
    requestAnimationFrame(() => {
      if (typeof editingPanelRef.current?.scrollIntoView === "function") {
        editingPanelRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, [editingId]);

  const questionsQuery = useQuery({
    queryKey: ["admin-questions"],
    queryFn: fetchQuestions,
  });

  const schedulesQuery = useQuery({
    queryKey: ["admin-question-schedules"],
    queryFn: fetchQuestionSchedules,
  });

  const schedulesByQuestionId = useMemo(() => {
    const map = new Map<string, { id: string; scheduled_date: string }[]>();
    (schedulesQuery.data ?? []).forEach((schedule) => {
      const existing = map.get(schedule.question_id) ?? [];
      existing.push({
        id: schedule.id,
        scheduled_date: schedule.scheduled_date,
      });
      map.set(schedule.question_id, existing);
    });
    return map;
  }, [schedulesQuery.data]);

  const responsesQuery = useQuery({
    queryKey: [
      "admin-responses",
      responseFilter.category,
      responseFilter.search,
      responseFilter.from,
      responseFilter.to,
    ],
    queryFn: () =>
      fetchResponses({
        category: responseFilter.category || undefined,
        search: responseFilter.search || undefined,
        from: responseFilter.from ? new Date(responseFilter.from).toISOString() : undefined,
        to: responseFilter.to ? new Date(responseFilter.to).toISOString() : undefined,
      }),
  });

  const categories = useMemo(() => {
    const values = questionsQuery.data ?? [];
    return Array.from(new Set(values.map((item) => item.category))).sort();
  }, [questionsQuery.data]);

  const responseCounts = useMemo(() => {
    const data = new Map<string, number>();
    (responsesQuery.data ?? []).forEach((response) => {
      data.set(response.category, (data.get(response.category) ?? 0) + 1);
    });
    return Array.from(data.entries()).map(([name, value]) => ({ name, value }));
  }, [responsesQuery.data]);

  const barData = useMemo(() => responseCounts, [responseCounts]);

  const handleLogout = () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    clearAdminSession();
    navigate("/admin/login");
  };

  const handleAddQuestion = async () => {
    const question = newQuestion.trim();
    const category = newCategory.trim();
    if (!question || !category) {
      toast.error("Please enter both a question and a category.");
      return;
    }

    try {
      setIsSavingQuestion(true);
      await createQuestion(question, category);
      setNewQuestion("");
      setNewCategory("");
      await questionsQuery.refetch();
      toast.success("Question created.");
    } catch (error) {
      toast.error("Unable to create question.", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingId) return;
    const question = editingQuestion.trim();
    const category = editingCategory.trim();
    if (!question || !category) {
      toast.error("Question and category cannot be empty.");
      return;
    }

    try {
      setIsSavingQuestion(true);
      await updateQuestion(editingId, question, category);
      setEditingId(null);
      setEditingQuestion("");
      setEditingCategory("");
      await questionsQuery.refetch();
      toast.success("Question updated.");
    } catch (error) {
      toast.error("Unable to update question.", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      setIsSavingQuestion(true);
      await deleteQuestion(id);
      await questionsQuery.refetch();
      await schedulesQuery.refetch();
      toast.success("Question deleted.");
    } catch (error) {
      toast.error("Unable to delete question.", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleAddSchedule = async (questionId: string, date: string) => {
    if (!date) return;

    try {
      setIsSavingQuestion(true);
      const result = await addQuestionSchedule(questionId, date);
      await schedulesQuery.refetch();
      if (result) {
        toast.success(`Question scheduled for ${date}.`);
      }
    } catch (error) {
      toast.error("Unable to save schedule.", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      setIsSavingQuestion(true);
      await deleteQuestionSchedule(scheduleId);
      await schedulesQuery.refetch();
      toast.success("Schedule removed.");
    } catch (error) {
      toast.error("Unable to remove schedule.", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/10 bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-6">
          <div>
            <h1 className="text-editorial text-3xl font-black tracking-tight">Admin dashboard</h1>
            <p className="text-editorial text-sm tracking-tight text-muted-foreground">
              {getAdminSession()?.email ?? "admin"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            type="button"
            className="inline-flex h-12 w-32 items-center justify-center rounded-none border border-foreground/40 bg-card text-[10px] uppercase tracking-[0.4em] text-muted-foreground hover:bg-foreground/5 transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="container mx-auto mt-8 grid grid-cols-1 gap-6 px-4 lg:grid-cols-[220px,1fr]">
        <nav className="space-y-3 rounded-none border border-border bg-card p-4 text-sm">
          <button
            onClick={() => setActiveTab("questions")}
            type="button"
            className={`w-full rounded-none border border-transparent px-3 py-2 text-left font-editorial tracking-tight ${
              activeTab === "questions" ? "border-foreground/30 bg-foreground/5" : ""
            }`}
          >
            Manage questions
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            type="button"
            className={`w-full rounded-none border border-transparent px-3 py-2 text-left font-editorial tracking-tight ${
              activeTab === "schedule" ? "border-foreground/30 bg-foreground/5" : ""
            }`}
          >
            Plan daily questions
          </button>
          <button
            onClick={() => setActiveTab("responses")}
            type="button"
            className={`w-full rounded-none border border-transparent px-3 py-2 text-left font-editorial tracking-tight ${
              activeTab === "responses" ? "border-foreground/30 bg-foreground/5" : ""
            }`}
          >
            Manage responses
          </button>
        </nav>

        <section className="space-y-6 rounded-none border border-border bg-card p-6">
          {activeTab === "questions" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-editorial text-xl font-bold tracking-tight">Create a question</h2>
                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    value={newQuestion}
                    onChange={(event) => setNewQuestion(event.target.value)}
                    placeholder="Question text"
                    className="flex-1 rounded-none border border-border px-3 py-2 text-sm"
                  />
                  <input
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                    placeholder="Category"
                    className="w-52 rounded-none border border-border px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleAddQuestion}
                    type="button"
                    disabled={isSavingQuestion}
                    className="rounded-none border border-foreground/40 bg-card px-4 py-2 text-xs tracking-tight text-muted-foreground hover:bg-foreground/5"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Pick a date for a question and it will be shown on that day. If several questions
                  share a date, one is chosen at random. With no planned date, visitors get a random
                  question.
                </p>
                <div className="flex items-center justify-between text-sm tracking-tight text-muted-foreground">
                  <span>Current questions</span>
                  <span>{questionsQuery.data?.length ?? 0} total</span>
                </div>
                <div className="space-y-4">
                  {(questionsQuery.data ?? []).map((questionItem) => (
                    <div
                      key={questionItem.id}
                      className="rounded-none border border-border px-4 py-3 text-sm"
                    >
                      <p className="text-editorial font-semibold text-base tracking-tight">
                        {questionItem.question}
                      </p>
                      <p className="text-mono text-[10px] tracking-tight text-muted-foreground">
                        {questionItem.category}
                      </p>
                      <div className="mt-3 space-y-2">
                        <label className="text-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                          Pick a date to show this question
                        </label>
                        <input
                          key={`${questionItem.id}-${(schedulesByQuestionId.get(String(questionItem.id)) ?? []).length}`}
                          type="date"
                          onChange={(event) => {
                            const date = event.target.value;
                            if (!date) return;
                            void handleAddSchedule(String(questionItem.id), date);
                          }}
                          disabled={isSavingQuestion}
                          className="rounded-none border border-border px-2 py-1 text-[10px]"
                        />
                        {(schedulesByQuestionId.get(String(questionItem.id)) ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {(schedulesByQuestionId.get(String(questionItem.id)) ?? []).map((schedule) => (
                              <button
                                key={schedule.id}
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                type="button"
                                disabled={isSavingQuestion}
                                className="rounded-none border border-primary/30 px-2 py-1 text-[10px] tracking-tight text-primary hover:bg-primary/5"
                              >
                                {schedule.scheduled_date} ×
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            const id = String(questionItem.id);
                            if (editingId === id) {
                              setEditingId(null);
                              setEditingQuestion("");
                              setEditingCategory("");
                              return;
                            }
                            setEditingId(id);
                            setEditingQuestion(questionItem.question);
                            setEditingCategory(questionItem.category);
                          }}
                          type="button"
                          disabled={isSavingQuestion}
                          className="rounded-none border border-foreground/40 px-3 py-1 text-[10px] tracking-tight text-muted-foreground"
                        >
                          {editingId === String(questionItem.id) ? "Editing…" : "Edit"}
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm("Delete this question? This cannot be undone.")) return;
                            handleDeleteQuestion(String(questionItem.id));
                          }}
                          type="button"
                          disabled={isSavingQuestion}
                          className="rounded-none border border-destructive px-3 py-1 text-[10px] tracking-tight text-destructive"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {editingId && (
                <div ref={editingPanelRef} className="rounded-none border border-border px-4 py-3">
                  <p className="text-sm tracking-tight text-muted-foreground">Editing</p>
                  <div className="mt-3 flex flex-col gap-3 md:flex-row">
                    <input
                      value={editingQuestion}
                      onChange={(event) => setEditingQuestion(event.target.value)}
                      className="flex-1 rounded-none border border-border px-3 py-2 text-sm"
                    />
                    <input
                      value={editingCategory}
                      onChange={(event) => setEditingCategory(event.target.value)}
                      className="w-52 rounded-none border border-border px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleUpdateQuestion}
                      type="button"
                      disabled={isSavingQuestion}
                      className="rounded-none border border-foreground/40 bg-card px-4 py-2 text-xs tracking-tight text-muted-foreground hover:bg-foreground/5 disabled:opacity-60"
                    >
                      Save changes
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      type="button"
                      disabled={isSavingQuestion}
                      className="rounded-none border border-muted px-4 py-2 text-xs tracking-tight text-muted-foreground hover:bg-foreground/5 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "schedule" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-editorial text-xl font-bold tracking-tight">Plan daily questions</h2>
                <p className="text-sm text-muted-foreground">
                  Pick a question and a date — it is saved as soon as you choose the date. Multiple
                  questions can share a date; one is chosen at random that day. With no planned date,
                  visitors get a random question.
                </p>
                <div className="flex flex-col gap-3 md:flex-row">
                  <select
                    value={scheduleQuestionId}
                    onChange={(event) => setScheduleQuestionId(event.target.value)}
                    className="flex-1 rounded-none border border-border px-3 py-2 text-sm"
                  >
                    <option value="">Choose a question</option>
                    {(questionsQuery.data ?? []).map((questionItem) => (
                      <option key={questionItem.id} value={questionItem.id}>
                        {questionItem.question}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(event) => {
                      const date = event.target.value;
                      setScheduleDate(date);
                      if (scheduleQuestionId && date) {
                        void handleAddSchedule(scheduleQuestionId, date).then(() => {
                          setScheduleDate("");
                        });
                      }
                    }}
                    disabled={!scheduleQuestionId || isSavingQuestion}
                    className="w-52 rounded-none border border-border px-3 py-2 text-sm disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm tracking-tight text-muted-foreground">
                  <span>Upcoming schedule</span>
                  <span>{schedulesQuery.data?.length ?? 0} planned</span>
                </div>
                <div className="space-y-4">
                  {(schedulesQuery.data ?? []).map((schedule) => (
                    <div
                      key={schedule.id}
                      className="rounded-none border border-border px-4 py-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                          {schedule.scheduled_date}
                        </p>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          type="button"
                          disabled={isSavingQuestion}
                          className="rounded-none border border-destructive px-3 py-1 text-[10px] tracking-tight text-destructive"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="mt-2 text-editorial font-semibold text-base tracking-tight">
                        {schedule.question?.question ?? "(question removed)"}
                      </p>
                      <p className="text-mono text-[10px] tracking-tight text-muted-foreground">
                        {schedule.question?.category ?? ""}
                      </p>
                    </div>
                  ))}
                  {!schedulesQuery.data?.length && (
                    <p className="text-sm text-muted-foreground">
                      No dates planned yet. Pick a date on a question to add it to the schedule.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-editorial text-xl font-bold tracking-tight">Responses overview</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Category</label>
                    <select
                      value={responseFilter.category}
                      onChange={(event) =>
                        setResponseFilter((prev) => ({ ...prev, category: event.target.value }))
                      }
                      className="mt-1 w-full rounded-none border border-border px-3 py-2 text-sm"
                    >
                      <option value="">All categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={responseFilter.search}
                    onChange={(event) =>
                        setResponseFilter((prev) => ({ ...prev, search: event.target.value }))
                      }
                      placeholder="Search responses"
                      className="rounded-none border border-border px-3 py-2 text-sm"
                    />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={responseFilter.from}
                      onChange={(event) =>
                        setResponseFilter((prev) => ({ ...prev, from: event.target.value }))
                      }
                      className="w-full rounded-none border border-border px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={responseFilter.to}
                      onChange={(event) =>
                        setResponseFilter((prev) => ({ ...prev, to: event.target.value }))
                      }
                      className="w-full rounded-none border border-border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-none border border-border px-4 py-4">
                  <p className="text-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                    Responses by category
                  </p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Tooltip content={<PieTooltip />} cursor={false} />
                      <Pie
                        data={responseCounts}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={2}
                      >
                        {responseCounts.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-none border border-border px-4 py-4">
                  <p className="text-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                    Response counts
                  </p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={barData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} height={30} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1f2937" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                {(responsesQuery.data ?? []).map((entry) => (
                  <div key={entry.id} className="rounded-none border border-border px-4 py-3">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                      <span>{entry.category}</span>
                      <span>{new Date(entry.created_at).toLocaleString("en-US")}</span>
                    </div>
                    <p className="text-editorial text-lg leading-snug text-foreground">
                      {entry.question?.question ?? "(no question)"}
                    </p>
                    <p className="text-mono text-sm text-muted-foreground">
                      {entry.response}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
