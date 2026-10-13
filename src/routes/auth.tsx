import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Hearth & Key" },
      { name: "description", content: "Sign in or create an account to save homes and contact owners." },
      { property: "og:title", content: "Sign in — Hearth & Key" },
      { property: "og:description", content: "Sign in to save homes and contact owners." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const field = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      setBusy(false);
      if (error) return toast.error(error.message);
      setSent(true);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <p className="eyebrow">Welcome</p>
      <h1 className="mt-3 text-4xl">{mode === "in" ? "Sign in" : "Create an account"}</h1>
      {sent ? (
        <p className="mt-6 rounded-md border border-border bg-card p-4">Check your email to confirm your account, then sign in.</p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input className={field} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={field} type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy} className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
          </button>
        </form>
      )}
      <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setSent(false); }} className="mt-6 text-sm text-muted-foreground hover:text-primary">
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
