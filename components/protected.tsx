"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";

export function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.push("/login"); }, [loading, user, router]);
  if (loading) return <main className="page"><div className="empty">Carregando sua sessao.</div></main>;
  if (!user) return null;
  return children;
}
