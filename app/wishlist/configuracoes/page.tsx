"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Copy, RefreshCw, Trash2, UserPlus, XCircle } from "lucide-react";
import { Protected } from "@/components/protected";
import { api } from "@/lib/client-api";

type Invite = {
  id: string;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

type Guest = {
  user_id: string;
  status: "active" | "removed";
  granted_at: string;
  display_name: string;
  username: string;
};

const inviteStatusLabels: Record<string, string> = {
  pending: "disponível",
  accepted: "reivindicado",
  revoked: "invalidado"
};

export default function SettingsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [inviteUrl, setInviteUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "type">("idle");
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const currentInvite = useMemo(() => invites[0] || null, [invites]);
  const activeGuests = guests.filter((guest) => guest.status === "active");

  async function load() {
    const next = await api("/api/dashboard");
    setData(next);
    setTitle(next.wishlist?.title || "");
    setVisibility(next.wishlist?.visibility || "public");
    if (next.wishlist) await loadAccess();
  }

  async function loadAccess() {
    const access = await api("/api/invites");
    setInvites(access.invites || []);
    setGuests(access.guests || []);
  }

  useEffect(() => { load().catch((err) => setError(err instanceof Error ? err.message : "Não foi possível carregar as configurações.")); }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    await api("/api/wishlist", { method: "PATCH", body: JSON.stringify({ title, visibility }) });
    setMessage("Configurações salvas.");
    await load();
  }

  async function generateInvite() {
    setMessage("");
    setError("");
    const res = await api("/api/invites", { method: "POST" });
    setInviteUrl(`${location.origin}${res.url}`);
    setMessage("Novo convite gerado. O link anterior foi invalidado.");
    await loadAccess();
  }

  async function revokeInvite(id: string) {
    setMessage("");
    setError("");
    await api(`/api/invites/${id}`, { method: "DELETE" });
    if (currentInvite?.id === id) setInviteUrl("");
    setMessage("Convite invalidado.");
    await loadAccess();
  }

  async function removeGuest(userId: string) {
    if (!confirm("Remover este convidado da wishlist?")) return;
    setMessage("");
    setError("");
    await api(`/api/guests/${userId}`, { method: "DELETE" });
    setMessage("Convidado removido.");
    await loadAccess();
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setMessage("Link de convite copiado.");
  }

  async function deleteWishlist(event: React.FormEvent) {
    event.preventDefault();
    if (!data?.wishlist || deleteConfirmName !== data.wishlist.title) return;
    setDeleting(true);
    setMessage("");
    setError("");
    try {
      await api("/api/wishlist", { method: "DELETE", body: JSON.stringify({ title: deleteConfirmName }) });
      router.push("/painel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível apagar a lista.");
      setDeleting(false);
    }
  }

  return (
    <Protected>
      <main className="page stack settings-page">
        <h1>Configurações da wishlist</h1>
        {error && <p className="error">{error}</p>}
        {!data?.wishlist ? <div className="empty">Crie sua wishlist primeiro.</div> : (
          <>
            <form className="panel stack" onSubmit={save}>
              <label className="field"><span>Título</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
              <label className="field"><span>Visibilidade</span><select className="select" value={visibility} onChange={(e) => setVisibility(e.target.value)}><option value="public">Qualquer pessoa</option><option value="invited">Somente convidados</option><option value="private">Somente eu</option></select></label>
              <button className="button primary">Salvar</button>
            </form>
            {message && <p className="success">{message}</p>}
            {data.wishlist.visibility === "invited" && (
              <section className="panel stack guest-panel">
                <div className="spread"><h2>Convidados</h2><button className="button" onClick={generateInvite}><RefreshCw size={17} aria-hidden />Gerar novo convite</button></div>
                <div className="guest-invite-state">
                  <span className="badge">{currentInvite ? inviteStatusLabels[currentInvite.status] : "sem convite"}</span>
                  {currentInvite?.status === "pending" && <button className="button danger" onClick={() => revokeInvite(currentInvite.id)}><XCircle size={17} aria-hidden />Invalidar convite</button>}
                </div>
                {inviteUrl && (
                  <div className="invite-copy-row">
                    <input className="input" readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} />
                    <button className="icon-button" title="Copiar convite" aria-label="Copiar convite" onClick={copyInvite}><Copy size={18} aria-hidden /></button>
                  </div>
                )}
                {activeGuests.length === 0 ? <div className="empty">Nenhum convidado ativo.</div> : (
                  <div className="guest-list">
                    {activeGuests.map((guest) => (
                      <article className="guest-row" key={guest.user_id}>
                        <div>
                          <strong>{guest.display_name}</strong>
                          <span className="muted">@{guest.username}</span>
                        </div>
                        <button className="icon-button danger" title="Remover convidado" aria-label={`Remover ${guest.display_name}`} onClick={() => removeGuest(guest.user_id)}><Trash2 size={18} aria-hidden /></button>
                      </article>
                    ))}
                  </div>
                )}
                <p className="muted"><UserPlus size={16} aria-hidden /> Convidados removidos perdem o acesso imediatamente e só voltam com um novo convite.</p>
              </section>
            )}
            <section className="panel stack danger-zone" aria-labelledby="delete-wishlist-title">
              <div className="danger-heading">
                <div>
                  <h2 id="delete-wishlist-title">Apagar lista</h2>
                  <p className="muted">Essa ação apaga a lista, os itens, convites, seguidores e reservas vinculados a ela.</p>
                </div>
                <AlertTriangle size={20} aria-hidden />
              </div>
              {deleteStep === "idle" && (
                <button className="button danger delete-list-button" onClick={() => setDeleteStep("confirm")}><Trash2 size={17} aria-hidden />Apagar lista</button>
              )}
              {deleteStep === "confirm" && (
                <div className="delete-confirmation">
                  <strong>Quer mesmo apagar a lista?</strong>
                  <div className="row">
                    <button className="button danger" onClick={() => setDeleteStep("type")}>Sim</button>
                    <button className="button" onClick={() => setDeleteStep("idle")}>Não</button>
                  </div>
                </div>
              )}
              {deleteStep === "type" && (
                <form className="delete-confirmation" onSubmit={deleteWishlist}>
                  <label className="field">
                    <span>Digite <strong>{data.wishlist.title}</strong> para confirmar</span>
                    <input className="input" value={deleteConfirmName} onChange={(event) => setDeleteConfirmName(event.target.value)} />
                  </label>
                  <div className="row">
                    <button className="button danger" disabled={deleteConfirmName !== data.wishlist.title || deleting}><Trash2 size={17} aria-hidden />{deleting ? "Apagando..." : "Apagar definitivamente"}</button>
                    <button className="button" type="button" onClick={() => { setDeleteStep("idle"); setDeleteConfirmName(""); }} disabled={deleting}>Cancelar</button>
                  </div>
                </form>
              )}
            </section>
          </>
        )}
      </main>
    </Protected>
  );
}