"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Protected } from "@/components/protected";
import { api } from "@/lib/client-api";

const inviteStatusLabels: Record<string, string> = {
  pending: "disponível",
  accepted: "reivindicado",
  revoked: "invalidado"
};

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    setLoadingInvite(true);
    setError("");
    api(`/api/invite/${token}`)
      .then((r) => { if (active) setInvite(r.invite); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Convite inválido."); })
      .finally(() => { if (active) setLoadingInvite(false); });
    return () => { active = false; };
  }, [token]);

  async function accept() {
    setError("");
    try {
      const res = await api(`/api/invite/${token}`, { method: "POST" });
      router.push(`/w/${res.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Convite inválido.");
    }
  }

  return (
    <Protected>
      <main className="page stack">
        <h1>Convite</h1>
        {loadingInvite ? <div className="empty">Carregando convite.</div> : !invite ? <div className="empty">Convite inválido.</div> : (
          <div className="panel stack">
            <p>Você foi convidado para <strong>{invite.title}</strong>, de {invite.owner_name}.</p>
            <span className="badge">{inviteStatusLabels[invite.status] || invite.status}</span>
            {invite.status === "pending" ? <button className="button primary" onClick={accept}>Aceitar convite</button> : <p className="muted">Este convite não está mais disponível.</p>}
            {error && <p className="error">{error}</p>}
          </div>
        )}
      </main>
    </Protected>
  );
}