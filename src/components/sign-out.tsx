"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="sign-out"><button disabled={busy} onClick={async () => {
    setBusy(true); setError("");
    try {
      const result = await createClient().auth.signOut({ scope: "local" });
      if (result.error) throw result.error;
      router.replace("/login"); router.refresh();
    } catch { setError("Couldn’t sign out. Try again."); setBusy(false); }
  }}>{busy ? "Signing out…" : "Sign out"}</button>{error && <span role="alert" className="error">{error}</span>}</div>;
}
