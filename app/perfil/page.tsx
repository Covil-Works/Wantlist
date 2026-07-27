"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Protected } from "@/components/protected";
import { api } from "@/lib/client-api";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => { api("/api/profile").then((r) => setProfile(r.profile)); }, []);
  return (
    <Protected>
      <main className="page stack">
        <Link className="icon-button page-nav-button" href="/painel" title="Voltar ao painel" aria-label="Voltar ao painel">
          <ArrowLeft size={18} aria-hidden />
        </Link>
        <h1>Perfil</h1>
        {!profile ? (
          <div className="empty">Perfil incompleto.</div>
        ) : (
          <div className="panel stack">
            <strong>{profile.display_name}</strong>
            <span className="muted">@{profile.username}</span>
            {user?.email && <span className="muted profile-email"><Mail size={16} aria-hidden />{user.email}</span>}
          </div>
        )}
      </main>
    </Protected>
  );
}
