"use client";

import Link from "next/link";
import { useState } from "react";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, isFirebaseConfigured } from "@/lib/firebase-client";
import { api } from "@/lib/client-api";

export function AuthForm({ mode }: { mode: "login" | "signup" | "reset" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(""); setMessage("");
    if (!isFirebaseConfigured) {
      setError("Firebase não configurado. Verifique as variáveis NEXT_PUBLIC_FIREBASE_* na Vercel e faça um novo deploy.");
      return;
    }
    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        setMessage("Enviamos as instruções de recuperação.");
        return;
      }
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push("/onboarding");
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
      const { profile } = await api("/api/profile");
      router.push(profile ? "/painel" : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação.");
    }
  }
  return (
    <form className="panel stack" onSubmit={submit}>
      <label className="field"><span>E-mail</span><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      {mode !== "reset" && <label className="field"><span>Senha</span><input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <button className="button primary" type="submit">{mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}</button>
      {mode === "login" && <Link className="muted" href="/recuperar-senha">Esqueci minha senha</Link>}
    </form>
  );
}
