"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/client-api";

const verifiedProfiles = new Set<string>();
const profileChecks = new Map<string, Promise<boolean>>();

function currentPath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export function Protected({ children, requireProfile = true }: { children: React.ReactNode; requireProfile?: boolean }) {
  const { user, loading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(() => requireProfile && (!user || !verifiedProfiles.has(user.uid)));
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
    if (verifiedProfiles.has(user.uid)) {
      setCheckingProfile(false);
      return;
    }

    let active = true;
    setCheckingProfile(true);
    let check = profileChecks.get(user.uid);
    if (!check) {
      check = api("/api/profile")
        .then(({ profile }) => {
          if (profile) verifiedProfiles.add(user.uid);
          return Boolean(profile);
        })
        .finally(() => profileChecks.delete(user.uid));
      profileChecks.set(user.uid, check);
    }
    check
      .then((hasProfile) => {
        if (!active) return;
        if (!hasProfile) {
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
