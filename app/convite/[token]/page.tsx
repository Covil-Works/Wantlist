"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Protected } from "@/components/protected";
import { api } from "@/lib/client-api";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => { api(`/api/invite/${token}`).then((r) => setInvite(r.invite)); }, [token]);
  async function accept() {
    try {
      const res = await api(`/api/invite/${token}`, { method: "POST" });
      router.push(`/w/${res.code}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Convite invalido."); }
  }
  return (
    <Protected>
      <main className="page stack">
        <h1>Convite</h1>
        {!invite ? <div className="empty">Convite invalido.</div> : <div className="panel stack"><p>Voce foi convidado para <strong>{invite.title}</strong>, de {invite.owner_name}.</p><span className="badge">{invite.status}</span>{invite.status === "pending" && <button className="button primary" onClick={accept}>Aceitar convite</button>}{error && <p className="error">{error}</p>}</div>}
      </main>
    </Protected>
  );
}
