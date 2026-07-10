"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/protected";
import { api } from "@/lib/client-api";

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [inviteUrl, setInviteUrl] = useState("");
  async function load() {
    const next = await api("/api/dashboard");
    setData(next);
    setTitle(next.wishlist?.title || "");
    setVisibility(next.wishlist?.visibility || "public");
  }
  useEffect(() => { load(); }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    await api("/api/wishlist", { method: "PATCH", body: JSON.stringify({ title, visibility }) });
    await load();
  }
  async function invite() {
    const res = await api("/api/invites", { method: "POST" });
    setInviteUrl(`${location.origin}${res.url}`);
  }
  return (
    <Protected>
      <main className="page stack">
        <h1>Configuracoes da wishlist</h1>
        {!data?.wishlist ? <div className="empty">Crie sua wishlist primeiro.</div> : (
          <>
            <form className="panel stack" onSubmit={save}>
              <label className="field"><span>Titulo</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
              <label className="field"><span>Visibilidade</span><select className="select" value={visibility} onChange={(e) => setVisibility(e.target.value)}><option value="public">Qualquer pessoa</option><option value="invited">Somente convidados</option><option value="private">Somente eu</option></select></label>
              <button className="button primary">Salvar</button>
            </form>
            <section className="panel stack">
              <div className="spread"><h2>Convidados</h2><button className="button" onClick={invite}>Gerar convite</button></div>
              {inviteUrl && <p className="success">{inviteUrl}</p>}
              <p className="muted">Convites aceitos aparecem em Wishlists que sigo para o convidado. Revogacao e remocao usam as APIs do MVP.</p>
            </section>
          </>
        )}
      </main>
    </Protected>
  );
}
