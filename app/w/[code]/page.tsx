"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Eye, EyeOff, Lock, MailPlus, Plus, Share2, Trash2, UserPlus, X } from "lucide-react";
import { api } from "@/lib/client-api";
import { useAuth } from "@/components/auth-provider";
import { ItemForm } from "@/components/item-form";

export default function PublicWishlistPage() {
  const { code } = useParams<{ code: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [showItemForm, setShowItemForm] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    setError("");
    try { setData(await api(`/api/wishlist/${code}`)); }
    catch { setError("Conteudo indisponivel ou sem permissao."); }
  }

  useEffect(() => { if (!loading) load(); }, [code, loading, user]);

  async function authAction(fn: () => Promise<void>) {
    if (!user) { router.push("/login"); return; }
    await fn(); await load();
  }

  async function changeVisibility(visibility: string) {
    await api("/api/wishlist", { method: "PATCH", body: JSON.stringify({ title: data.wishlist.title, visibility }) });
    await load();
  }

  async function invite() {
    const res = await api("/api/invites", { method: "POST" });
    setInviteUrl(`${location.origin}${res.url}`);
  }

  async function share() {
    await navigator.clipboard.writeText(`${location.origin}/w/${data.wishlist.public_code}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function reserve(id: string) { await api(`/api/items/${id}/reserve`, { method: "POST" }); }
  async function unreserve(id: string) { await api(`/api/items/${id}/reserve`, { method: "DELETE" }); }
  async function remove(id: string) {
    if (confirm("Excluir este item definitivamente?")) {
      await api(`/api/items/${id}`, { method: "DELETE" }); await load();
    }
  }

  if (loading || (!data && !error)) return <main className="page"><div className="empty">Carregando wishlist.</div></main>;
  if (error) return <main className="page"><div className="empty">{error}</div></main>;

  return (
    <main className="page stack">
      <header className="wishlist-header">
        <div className="stack">
          <h1>{data.wishlist.title}</h1>
          <p className="muted">Wishlist de <strong>{data.wishlist.owner_name}</strong> · {data.items.length} itens</p>
        </div>
        <div className="wishlist-actions" aria-label="Acoes da wishlist">
          <span className="badge">{data.wishlist.visibility}</span>
          {data.isOwner && (
            <>
              <button className="icon-button" title={showItemForm ? "Fechar formulario" : "Adicionar item"} aria-label={showItemForm ? "Fechar formulario" : "Adicionar item"} onClick={() => setShowItemForm((value) => !value)}>
                {showItemForm ? <X size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
              </button>
              <button className="icon-button" title="Copiar link" aria-label="Copiar link" onClick={share}><Share2 size={18} aria-hidden /></button>
              <button className="icon-button" title="Gerar convite" aria-label="Gerar convite" onClick={invite}><MailPlus size={18} aria-hidden /></button>
              <button className="icon-button" title="Tornar publica" aria-label="Tornar publica" disabled={data.wishlist.visibility === "public"} onClick={() => changeVisibility("public")}><Eye size={18} aria-hidden /></button>
              <button className="icon-button" title="Somente convidados" aria-label="Somente convidados" disabled={data.wishlist.visibility === "invited"} onClick={() => changeVisibility("invited")}><UserPlus size={18} aria-hidden /></button>
              <button className="icon-button" title="Tornar privada" aria-label="Tornar privada" disabled={data.wishlist.visibility === "private"} onClick={() => changeVisibility("private")}><Lock size={18} aria-hidden /></button>
            </>
          )}
          {!data.isOwner && data.wishlist.visibility === "public" && (
            <button className="button" onClick={() => authAction(async () => {
              await api(`/api/follow/${code}`, { method: data.following ? "DELETE" : "POST" });
            })}>{data.following ? "Deixar de seguir" : "Seguir"}</button>
          )}
        </div>
      </header>

      {copied && <p className="success">Link copiado.</p>}
      {inviteUrl && <p className="success">Convite gerado: {inviteUrl}</p>}
      {data.isOwner && showItemForm && <ItemForm onSaved={() => { setShowItemForm(false); load(); }} />}

      {data.items.length === 0 ? <div className="empty">Esta wishlist ainda nao possui itens.</div> : (
        <section className="item-list" aria-label="Itens da wishlist">
          {data.items.map((item: any) => (
            <article className="item-row" key={item.id}>
              {item.image_url ? <Image className="item-row-image" src={item.image_url} alt="" width={88} height={88} unoptimized /> : <div className="item-row-image" />}
              <div className="item-row-copy">
                <strong title={item.name}>{item.name}</strong>
                <span className="muted">{item.domain}</span>
              </div>
              <span className={`badge item-status ${item.reserved ? "reserved" : "available"}`}>{item.reserved_by_me ? "Seu" : item.reserved ? "Reservado" : "Disponivel"}</span>
              <div className="item-row-actions">
                <a className="icon-button" href={item.original_url} target="_blank" rel="noreferrer" title="Ver item" aria-label={`Ver ${item.name}`}><ArrowUpRight size={18} aria-hidden /></a>
                {!data.isOwner && !item.reserved && <button className="button primary compact" onClick={() => authAction(() => reserve(item.id))}>Reservar</button>}
                {!data.isOwner && item.reserved_by_me && <button className="button compact" onClick={() => authAction(() => unreserve(item.id))}>Desfazer</button>}
                {data.isOwner && item.reserved && <button className="icon-button danger" title="Remover reserva" aria-label="Remover reserva" onClick={() => confirm("Remover a reserva deste item?") && authAction(() => unreserve(item.id))}><EyeOff size={18} aria-hidden /></button>}
                {data.isOwner && <button className="icon-button danger" title="Excluir item" aria-label={`Excluir ${item.name}`} onClick={() => remove(item.id)}><Trash2 size={18} aria-hidden /></button>}
              </div>
            </article>
          ))}
        </section>
      )}
      {data.isOwner && <Link className="button" href="/painel">Voltar ao painel</Link>}
    </main>
  );
}
