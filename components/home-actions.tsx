"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function HomeActions() {
  const { user, loading } = useAuth();

  if (loading) return <div className="home-actions-placeholder" aria-hidden="true" />;
  if (user) return <Link className="button primary" href="/painel">Acessar meu painel</Link>;

  return (
    <div className="row">
      <Link className="button primary" href="/cadastro">Criar conta</Link>
      <Link className="button" href="/login">Entrar</Link>
    </div>
  );
}
