"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/client-api";

function currentPath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export function Protected({ children, requireProfile = true }: { children: React.ReactNode; requireProfile?: boolean }) {
  const { user, loading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(requireProfile);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(currentPath())}`);
  }, [loading, user, router]);

  useEffect(() => {
    if (loading) return;
    if (!user || !requireProfile) {
      setCheckingProfile(false);
      return;
    }

    let active = true;
    setCheckingProfile(true);
    api("/api/profile")
      .then(({ profile }) => {
        if (!active) return;
        if (!profile) {
          router.replace(`/onboarding?next=${encodeURIComponent(currentPath())}`);
          return;
        }
        setCheckingProfile(false);
      })
      .catch(() => {
        if (active) setCheckingProfile(false);
      });

    return () => {
      active = false;
    };
  }, [loading, user, requireProfile, router]);

  if (loading || checkingProfile) return <main className="page"><div className="empty">Carregando sua sessão.</div></main>;
  if (!user) return null;
  return children;
}