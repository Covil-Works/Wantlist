"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Copy, Eye, EyeOff, Globe2, Home, MailPlus, MoreHorizontal, Plus, Settings, Share2, Trash2, UserPlus, X } from "lucide-react";
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
  const [shareCopied, setShareCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  async function load() {
    setError("");
    setData(null);
    try { setData(await api(`/api/wishlist/${code}`)); }
    catch { setError("not-found"); }
  }

  useEffect(() => { if (!loading) load(); }, [code, loading, user]);

  useEffect(() => {
    if (!showShareMenu && !showVisibilityMenu) return;

    function closeMenusOnOutsideClick(event: PointerEvent) {
      if (!(event.target instanceof Node)) return;

      const clickedShareMenu = shareMenuRef.current?.contains(event.target);

      if (!clickedShareMenu) {
        setShowShareMenu(false);
        setShowVisibilityMenu(false);
      }
    }

    document.addEventListener("pointerdown", closeMenusOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeMenusOnOutsideClick);
  }, [showShareMenu, showVisibilityMenu]);

  async function authAction(fn: () => Promise<void>) {
    if (!user) { router.push("/login"); return; }
    await fn(); await load();
  }

  function toggleItem(id: string) {
    setExpandedItemId((current) => current === id ? null : id);
  }

  function toggleShareMenu() {
    setShowShareMenu((value) => !value);
    setShowVisibilityMenu(false);
  }

  async function changeVisibility(visibility: string) {
    setShowVisibilityMenu(false);
    await api("/api/wishlist", { method: "PATCH", body: JSON.stringify({ title: data.wishlist.title, visibility }) });
    await load();
  }

  async function invite() {
    setShowShareMenu(false);
    setInviteCopied(false);
    const res = await api("/api/invites", { method: "POST" });
    setInviteUrl(`${location.origin}${res.url}`);
    setShowInviteModal(true);
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setInviteCopied(true);
    window.setTimeout(() => setInviteCopied(false), 1800);
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(`${location.origin}/w/${data.wishlist.public_code}`);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1800);
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

  const shareUrl = typeof location === "undefined" ? `/w/${data.wishlist.public_code}` : `${location.origin}/w/${data.wishlist.public_code}`;

  return (
    <main className="page stack wishlist-page">
      <div className="wishlist-topbar">
        <Link className="icon-button page-nav-button" href={user ? "/painel" : "/"} title={user ? "Voltar ao painel" : "Voltar para a página inicial"} aria-label={user ? "Voltar ao painel" : "Voltar para a página inicial"}>
          <ArrowLeft size={18} aria-hidden />
        </Link>
        <div className="wishlist-actions" aria-label="Ações da wishlist">
          {data.isOwner && (
            <div className="wishlist-owner-actions" ref={shareMenuRef}>
              <div className="menu-wrap">
                <button className="icon-button" title="Compartilhar" aria-label="Compartilhar" aria-expanded={showShareMenu} aria-controls="share-menu" onClick={toggleShareMenu}><Share2 size={18} aria-hidden /></button>
                {showShareMenu && (
                  <div className="dropdown-menu share-menu wishlist-topbar-menu" id="share-menu" role="menu">
                    <strong>Compartilhar wishlist</strong>
                    <div className="share-link-plain">{shareUrl}</div>
                    <button className="menu-option" onClick={copyShareLink} role="menuitem">
                      <Copy size={18} aria-hidden />
                      <span><strong>Copiar link</strong><small>Copie o link público da lista.</small></span>
                    </button>
                    {shareCopied && <p className="share-copy-feedback" role="status">Link copiado.</p>}
                    <button className="menu-option" onClick={invite} role="menuitem">
                      <MailPlus size={18} aria-hidden />
                      <span><strong>Convidar amigo</strong><small>Gere um convite para acesso à lista.</small></span>
                    </button>
                  </div>
                )}
              </div>
              <div className="menu-wrap">
                <button className="icon-button" title="Alterar visibilidade" aria-label="Alterar visibilidade" aria-expanded={showVisibilityMenu} onClick={() => { setShowVisibilityMenu((value) => !value); setShowShareMenu(false); }}><Eye size={18} aria-hidden /></button>
                {showVisibilityMenu && (
                  <div className="dropdown-menu visibility-menu wishlist-topbar-menu" role="menu">
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
              <Link className="icon-button wishlist-config-button" href="/wishlist/configuracoes" title="Configurar wishlist" aria-label="Configurar wishlist"><Settings size={18} aria-hidden /></Link>
            </div>
          )}
          {!data.isOwner && data.wishlist.visibility === "public" && (
            <button className="button" onClick={() => authAction(async () => {
              await api(`/api/follow/${code}`, { method: data.following ? "DELETE" : "POST" });
            })}>{data.following ? "Deixar de seguir" : "Seguir"}</button>
          )}
        </div>
      </div>

      <header className="wishlist-header">
        <span className="wishlist-kicker">Minha lista de desejos</span>
        <h1>{data.wishlist.title}</h1>
        <p className="muted wishlist-meta">
          <span>Wishlist de <strong>{data.wishlist.owner_name}</strong></span>
          <span>{data.items.length} itens</span>
        </p>
      </header>

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
            {inviteCopied && <p className="success" role="status">Convite copiado.</p>}
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
          const hasDescription = Boolean(item.description);
          const hasExpandedDetails = hasDescription || expanded;
          const detailsId = `item-details-${item.id}`;
          return (
            <article
              className={`item-row${expanded ? " expanded" : ""}`}
              key={item.id}
            >
              {item.image_url ? <Image className="item-row-image" src={item.image_url} alt="" width={88} height={88} unoptimized /> : <div className="item-row-image" />}
              <div className="item-row-copy">
                <strong className="item-row-title" title={item.name}>{item.name}</strong>
                <span className="muted">{item.domain}</span>
                {expanded && <span className={`badge item-status ${item.reserved ? "reserved" : "available"} item-row-copy-status`}>{item.reserved_by_me ? "Seu" : item.reserved ? "Reservado" : "Disponível"}</span>}
              </div>
              <div className="item-row-actions">
                <button className="icon-button" title={expanded ? "Recolher detalhes" : "Ver detalhes"} aria-label={expanded ? "Recolher detalhes" : `Ver detalhes de ${item.name}`} aria-expanded={expanded} aria-controls={hasExpandedDetails ? detailsId : undefined} onClick={() => toggleItem(item.id)}><MoreHorizontal size={18} aria-hidden /></button>
                <a className="icon-button" href={item.original_url} target="_blank" rel="noreferrer" title="Ver item" aria-label={`Ver ${item.name}`}><ArrowUpRight size={18} aria-hidden /></a>
                {!data.isOwner && !item.reserved && <button className="button primary compact" onClick={() => authAction(() => reserve(item.id))}>Reservar</button>}
                {!data.isOwner && item.reserved_by_me && <button className="button compact" onClick={() => authAction(() => unreserve(item.id))}>Desfazer</button>}
                {data.isOwner && item.reserved && <button className="icon-button danger" title="Remover reserva" aria-label="Remover reserva" onClick={() => confirm("Remover a reserva deste item?") && authAction(() => unreserve(item.id))}><EyeOff size={18} aria-hidden /></button>}
                {data.isOwner && <button className="icon-button danger" title="Excluir item" aria-label={`Excluir ${item.name}`} onClick={() => remove(item.id)}><Trash2 size={18} aria-hidden /></button>}
              </div>
              {expanded && hasExpandedDetails && (
                <div className="item-row-details" id={detailsId}>
                  {hasDescription && <p>{item.description}</p>}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {data.isOwner && !showItemForm && <button className="fab-add" aria-label="Adicionar item" onClick={() => setShowItemForm(true)}><Plus size={24} aria-hidden /></button>}
    </main>
  );
}
