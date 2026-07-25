"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Protected } from "@/components/protected";
import { api } from "@/lib/client-api";

export default function OnboardingPage() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const nextPath = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("next");
  const safeNextPath = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/profile", { method: "POST", body: JSON.stringify({ displayName, username }) });
      router.push(safeNextPath || "/painel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }
  return (
    <Protected requireProfile={false}>
      <main className="page stack">
        <h1>Complete seu perfil</h1>
        <form className="panel stack" onSubmit={submit}>
          <label className="field"><span>Nome de exibição</span><input className="input" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label>
          <label className="field"><span>Nome de usuário</span><input className="input" required value={username} onChange={(e) => setUsername(e.target.value)} /></label>
          {error && <p className="error">{error}</p>}
          <button className="button primary">Salvar perfil</button>
        </form>
      </main>
    </Protected>
  );
}
