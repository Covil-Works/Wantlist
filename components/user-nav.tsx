"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth-provider";

export function UserNav() {
  const { user, loading } = useAuth();
  if (loading) return <nav className="nav"><span className="muted">Carregando</span></nav>;
  if (!user) {
    return <nav className="nav"><Link className="button" href="/login">Entrar</Link><Link className="button primary" href="/cadastro">Cadastro</Link></nav>;
  }
  return <nav className="nav"><Link className="button" href="/painel">Painel</Link><button className="button" onClick={() => signOut(auth)}>Sair</button></nav>;
}
