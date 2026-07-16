"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Protected } from "@/components/protected";
import { api } from "@/lib/client-api";

type Dashboard = { profile: { display_name: string }; wishlist: any; following: any[] };

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [error, setError] = useState("");
  async function load() { setData(await api("/api/dashboard")); }
  useEffect(() => { load().catch(() => setError("Complete seu perfil para acessar o painel.")); }, []);
  async function createWishlist(event: React.FormEvent) {
    event.preventDefault();
    await api("/api/wishlist", { method: "POST", body: JSON.stringify({ title, visibility }) });
    await load();
  }
  return (
    <Protected>
      <main className="page stack">
        <div><h1>Painel</h1><p className="muted">Gerencie sua lista e acompanhe wishlists que voce segue.</p></div>
        {error && <div className="empty">{error} <Link href="/onboarding">Ir para onboarding</Link></div>}
        {!data ? <div className="empty">Carregando painel.</div> : (
          <div className="grid">
            <section className="stack">
              <h2>Minha wishlist</h2>
              {!data.wishlist ? (
                <form className="panel stack" onSubmit={createWishlist}>
                  <p className="muted">Crie uma wishlist unica para compartilhar produtos de qualquer loja.</p>
                  <label className="field"><span>Titulo</span><input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} /></label>
                  <label className="field"><span>Visibilidade</span><select className="select" value={visibility} onChange={(e) => setVisibility(e.target.value)}><option value="public">Qualquer pessoa</option><option value="invited">Somente convidados</option><option value="private">Somente eu</option></select></label>
                  <button className="button primary">Criar minha wishlist</button>
                </form>
              ) : (
                <div className="panel stack">
                  <div className="spread"><strong>{data.wishlist.title}</strong><span className="badge">{data.wishlist.visibility}</span></div>
                  <p className="muted">/{`w/${data.wishlist.public_code}`}</p>
                  <div className="row">
                    <span className="badge">{data.wishlist.item_count} itens</span>
                    <span className="badge available">{data.wishlist.item_count - data.wishlist.reserved_count} disponiveis</span>
                    <span className="badge reserved">{data.wishlist.reserved_count} reservados</span>
                  </div>
                  <Link className="button primary" href={`/w/${data.wishlist.public_code}`}><ExternalLink size={16} aria-hidden />Abrir wishlist</Link>
                </div>
              )}
            </section>
            <section className="stack">
              <h2>Wishlists que sigo</h2>
              {data.following.length === 0 ? <div className="empty">Nenhuma wishlist acompanhada ainda. Abra uma lista publica ou aceite um convite.</div> : data.following.map((w) => (
                <div className="panel stack" key={w.public_code}>
                  <div className="spread"><strong>{w.title}</strong><span className="badge">{w.access_type}</span></div>
                  <p className="muted">De {w.owner_name} · {w.item_count} itens</p>
                  <Link className="button" href={`/w/${w.public_code}`}>Abrir</Link>
                </div>
              ))}
            </section>
          </div>
        )}
      </main>
    </Protected>
  );
}
