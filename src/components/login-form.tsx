"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <form onSubmit={async event => {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email: String(form.get("email")).trim(), password: String(form.get("password")) });
      if (error) { setMessage("Sign-in failed. Check your email and password, or ask the project owner for access."); return; }
      router.replace("/"); router.refresh();
    } catch { setMessage("Couldn’t reach sign-in. Check your connection and try again."); }
    finally { setBusy(false); }
  }}>
    <label className="field">Email<input name="email" type="email" autoComplete="username" placeholder="you@company.com" required /></label>
    <label className="field">Password<input name="password" type="password" autoComplete="current-password" required /></label>
    {message && <p className="error" role="alert">{message}</p>}
    <button className="primary full-width" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
  </form>;
}
