"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Eye, EyeOff, Globe2, Home, MailPlus, MoreHorizontal, Plus, Share2, Trash2, UserPlus, X } from "lucide-react";
import { api } from "@/lib/client-api";
import { useAuth } from "@/components/auth-provider";
import { ItemForm } from "@/components/item-form";

const visibilityOptions = [
  { value: "public", label: "Pública", description: "Qualquer pessoa com o link pode ver.", icon: Globe2 },
  { value: "invited", label: "Somente convidados", description: "Apenas pessoas convidadas acessam.", icon: UserPlus },
  { value: "private", label: "Somente eu", description: "A lista fica privada para você.", icon: EyeOff },
];

function visibilityLabel(value: string) {
  return visibilityOptions.find((option) => option.value === value)?.label || value;
}

function ContentNotFound() {
  return (
    <main className="page not-found-page">
      <section className="not-found-panel">
        <strong>404</strong>
        <h1>Conteúdo não encontrado</h1>
        <p>Este conteúdo não existe ou não está disponível.</p>
        <Link className="button primary" href="/"><Home size={18} aria-hidden />Voltar para a página inicial</Link>
      </section>
    </main>
  );
}

export default function PublicWishlistPage() {
  const { code } = useParams<{ code: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [showItemForm, setShowItemForm] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  async function load() {
    setError("");
    setData(null);
    try { setData(await api(`/api/wishlist/${code}`)); }
    catch { setError("not-found"); }
  }

  useEffect(() => { if (!loading) load(); }, [code, loading, user]);

  async function authAction(fn: () => Promise<void>) {
    if (!user) { router.push("/login"); return; }
    await fn(); await load();
  }

  function toggleItem(id: string) {
    setExpandedItemId((current) => current === id ? null : id);
  }

  async function changeVisibility(visibility: string) {
    setShowVisibilityMenu(false);
    await api("/api/wishlist", { method: "PATCH", body: JSON.stringify({ title: data.wishlist.title, visibility }) });
    await load();
  }

  async function invite() {
    const res = await api("/api/invites", { method: "POST" });
    setInviteUrl(`${location.origin}${res.url}`);
    setShowInviteModal(true);
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
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
  if (error) return <ContentNotFound />;

  return (
    <main className="page stack">
      <header className="wishlist-header">
        <div className="stack">
          <span className="wishlist-kicker">Minha lista de desejos:</span>
          <h1>{data.wishlist.title}</h1>
          <p className="muted">Wishlist de <strong>{data.wishlist.owner_name}</strong> · {data.items.length} itens</p>
        </div>
        <div className="wishlist-actions" aria-label="Ações da wishlist">
          <span className="badge">{visibilityLabel(data.wishlist.visibility)}</span>
          {data.isOwner && (
            <>
              <button className="icon-button" title="Copiar link" aria-label="Copiar link" onClick={share}><Share2 size={18} aria-hidden /></button>
              <button className="icon-button" title="Gerar convite" aria-label="Gerar convite" onClick={invite}><MailPlus size={18} aria-hidden /></button>
              <div className="menu-wrap">
                <button className="icon-button" title="Alterar visibilidade" aria-label="Alterar visibilidade" onClick={() => setShowVisibilityMenu((value) => !value)}><Eye size={18} aria-hidden /></button>
                {showVisibilityMenu && (
                  <div className="dropdown-menu visibility-menu" role="menu">
                    <strong>Escolha a visibilidade da lista</strong>
                    {visibilityOptions.map((option) => {
                      const Icon = option.icon;
                      const active = data.wishlist.visibility === option.value;
                      return (
                        <button className="menu-option" disabled={active} key={option.value} onClick={() => changeVisibility(option.value)} role="menuitem">
                          <Icon size={18} aria-hidden />
                          <span><strong>{option.label}</strong><small>{option.description}</small></span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
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

      {data.isOwner && showInviteModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowInviteModal(false)}>
          <section className="modal-panel stack" role="dialog" aria-modal="true" aria-labelledby="invite-title" onClick={(event) => event.stopPropagation()}>
            <div className="form-heading">
              <div>
                <h2 id="invite-title">Convite da wishlist</h2>
                <p className="muted">Envie este link para quem pode acessar a lista.</p>
              </div>
              <button className="icon-button" title="Fechar convite" aria-label="Fechar convite" onClick={() => setShowInviteModal(false)}><X size={18} aria-hidden /></button>
            </div>
            <input className="input" readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} />
            <div className="row">
              <button className="button primary" onClick={copyInvite}>Copiar convite</button>
              <button className="button" onClick={() => setShowInviteModal(false)}>Fechar</button>
            </div>
          </section>
        </div>
      )}

      <section className="item-list" aria-label="Itens da wishlist">
        {data.isOwner && !showItemForm && (
          <button className="button primary add-item-inline" onClick={() => setShowItemForm(true)}><Plus size={18} aria-hidden />Adicionar item</button>
        )}
        {data.isOwner && showItemForm && <ItemForm onCancel={() => setShowItemForm(false)} onSaved={() => { setShowItemForm(false); load(); }} />}
        {data.items.length === 0 ? <div className="empty">Esta wishlist ainda não possui itens.</div> : data.items.map((item: any) => {
          const expanded = expandedItemId === item.id;
          const detailsId = `item-details-${item.id}`;
          return (
            <article
              className={`item-row${expanded ? " expanded" : ""}`}
              key={item.id}
              role="button"
              tabIndex={0}
              aria-expanded={expanded}
              aria-controls={detailsId}
              onClick={() => toggleItem(item.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleItem(item.id);
                }
              }}
            >
              {item.image_url ? <Image className="item-row-image" src={item.image_url} alt="" width={88} height={88} unoptimized /> : <div className="item-row-image" />}
              <div className="item-row-copy">
                <strong className="item-row-title" title={item.name}>{item.name}</strong>
                <span className="muted">{item.domain}</span>
              </div>
              <span className={`badge item-status ${item.reserved ? "reserved" : "available"}`}>{item.reserved_by_me ? "Seu" : item.reserved ? "Reservado" : "Disponível"}</span>
              <div className="item-row-actions" onClick={(event) => event.stopPropagation()}>
                <button className="icon-button" title={expanded ? "Recolher detalhes" : "Ver detalhes"} aria-label={expanded ? "Recolher detalhes" : `Ver detalhes de ${item.name}`} onClick={() => toggleItem(item.id)}><MoreHorizontal size={18} aria-hidden /></button>
                <a className="icon-button" href={item.original_url} target="_blank" rel="noreferrer" title="Ver item" aria-label={`Ver ${item.name}`}><ArrowUpRight size={18} aria-hidden /></a>
                {!data.isOwner && !item.reserved && <button className="button primary compact" onClick={() => authAction(() => reserve(item.id))}>Reservar</button>}
                {!data.isOwner && item.reserved_by_me && <button className="button compact" onClick={() => authAction(() => unreserve(item.id))}>Desfazer</button>}
                {data.isOwner && item.reserved && <button className="icon-button danger" title="Remover reserva" aria-label="Remover reserva" onClick={() => confirm("Remover a reserva deste item?") && authAction(() => unreserve(item.id))}><EyeOff size={18} aria-hidden /></button>}
                {data.isOwner && <button className="icon-button danger" title="Excluir item" aria-label={`Excluir ${item.name}`} onClick={() => remove(item.id)}><Trash2 size={18} aria-hidden /></button>}
              </div>
              {expanded && (
                <div className="item-row-details" id={detailsId}>
                  {item.description ? <p>{item.description}</p> : <p className="muted">Este item ainda não tem descrição.</p>}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {data.isOwner && !showItemForm && <button className="fab-add" aria-label="Adicionar item" onClick={() => setShowItemForm(true)}><Plus size={24} aria-hidden /></button>}
      {data.isOwner && <Link className="button back-to-dashboard" href="/painel">Voltar ao painel</Link>}
    </main>
  );
}
