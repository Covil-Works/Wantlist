"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/protected";
import { api } from "@/lib/client-api";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => { api("/api/profile").then((r) => setProfile(r.profile)); }, []);
  return <Protected><main className="page stack"><h1>Perfil</h1>{!profile ? <div className="empty">Perfil incompleto.</div> : <div className="panel stack"><strong>{profile.display_name}</strong><span className="muted">@{profile.username}</span></div>}</main></Protected>;
}
