import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  createQuestion,
  deleteQuestion,
  fetchQuestions,
  fetchResponses,
  updateQuestion,
} from "@/lib/admin";
import { clearAdminSession, getAdminSession } from "@/lib/adminSession";
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
  const [activeTab, setActiveTab] = useState<"questions" | "responses">("questions");
  const [newQuestion, setNewQuestion] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [responseFilter, setResponseFilter] = useState({
    category: "",
    search: "",
    from: "",
    to: "",
  });

  const questionsQuery = useQuery({
    queryKey: ["admin-questions"],
    queryFn: fetchQuestions,
  });

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
    if (!newQuestion.trim() || !newCategory.trim()) return;
    await createQuestion(newQuestion.trim(), newCategory.trim());
    setNewQuestion("");
    setNewCategory("");
    questionsQuery.refetch();
  };

  const handleUpdateQuestion = async () => {
    if (!editingId) return;
    await updateQuestion(editingId, editingQuestion.trim(), editingCategory.trim());
    setEditingId(null);
    setEditingQuestion("");
    setEditingCategory("");
    questionsQuery.refetch();
  };

  const handleDeleteQuestion = async (id: string) => {
    await deleteQuestion(id);
    questionsQuery.refetch();
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
            className={`w-full rounded-none border border-transparent px-3 py-2 text-left font-editorial tracking-tight ${
              activeTab === "questions" ? "border-foreground/30 bg-foreground/5" : ""
            }`}
          >
            Manage questions
          </button>
          <button
            onClick={() => setActiveTab("responses")}
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
                    className="rounded-none border border-foreground/40 bg-card px-4 py-2 text-xs tracking-tight text-muted-foreground hover:bg-foreground/5"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="space-y-3">
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
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setEditingId(questionItem.id);
                            setEditingQuestion(questionItem.question);
                            setEditingCategory(questionItem.category);
                          }}
                          className="rounded-none border border-foreground/40 px-3 py-1 text-[10px] tracking-tight text-muted-foreground"
                        >
                          Edit
                        </button>
                    <button
                      onClick={() => {
                        if (!confirm("Delete this question? This cannot be undone.")) return;
                        handleDeleteQuestion(questionItem.id);
                      }}
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
                <div className="rounded-none border border-border px-4 py-3">
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
                    className="rounded-none border border-foreground/40 bg-card px-4 py-2 text-xs tracking-tight text-muted-foreground hover:bg-foreground/5"
                    >
                      Save changes
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                    className="rounded-none border border-muted px-4 py-2 text-xs tracking-tight text-muted-foreground hover:bg-foreground/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
