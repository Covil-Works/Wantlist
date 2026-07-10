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
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/profile", { method: "POST", body: JSON.stringify({ displayName, username }) });
      router.push("/painel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar.");
    }
  }
  return (
    <Protected>
      <main className="page stack">
        <h1>Complete seu perfil</h1>
        <form className="panel stack" onSubmit={submit}>
          <label className="field"><span>Nome de exibicao</span><input className="input" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label>
          <label className="field"><span>Nome de usuario</span><input className="input" required value={username} onChange={(e) => setUsername(e.target.value)} /></label>
          {error && <p className="error">{error}</p>}
          <button className="button primary">Salvar perfil</button>
        </form>
      </main>
    </Protected>
  );
}
