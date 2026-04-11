import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInAdmin } from "@/lib/admin";
import { persistAdminSession } from "@/lib/adminSession";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = await signInAdmin(email.trim(), password);
      persistAdminSession({ email: session.email });
      navigate("/admin");
    } catch (err) {
      console.error("Admin login failed", err);
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-md border border-foreground/10 bg-card p-8 shadow-lg"
      >
        <div>
          <h1 className="text-editorial text-3xl font-black text-foreground">
            Admin login
          </h1>
          <p className="text-mono text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Manage questions & responses
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-none border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-none border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary"
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-none border border-foreground/30 bg-foreground/5 px-4 py-2 text-sm uppercase tracking-[0.4em] text-muted-foreground"
        >
          {loading ? "Signing in…" : "Continue"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
