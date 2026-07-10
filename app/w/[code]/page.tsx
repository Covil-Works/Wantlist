"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { useAuth } from "@/components/auth-provider";

export default function PublicWishlistPage() {
  const { code } = useParams<{ code: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
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
      <div className="spread">
        <div>
          <h1>{data.wishlist.title}</h1>
          <p className="muted">De {data.wishlist.owner_name} · {data.items.length} itens</p>
        </div>
        <div className="row">
          <span className="badge">{data.wishlist.visibility}</span>
          {!data.isOwner && data.wishlist.visibility === "public" && (
            <button className="button" onClick={() => authAction(async () => {
              await api(`/api/follow/${code}`, { method: data.following ? "DELETE" : "POST" });
            })}>{data.following ? "Deixar de seguir" : "Seguir"}</button>
          )}
        </div>
      </div>
      {data.items.length === 0 ? <div className="empty">Esta wishlist ainda nao possui itens.</div> : (
        <section className="grid">
          {data.items.map((item: any) => (
            <article className="item-card" key={item.id}>
              {item.image_url ? <Image className="item-image" src={item.image_url} alt="" width={480} height={360} unoptimized /> : <div className="item-image" />}
              <div className="item-body">
                <div className="spread"><strong>{item.name}</strong><span className={`badge ${item.reserved ? "reserved" : "available"}`}>{item.reserved_by_me ? "Reservado por voce" : item.reserved ? "Item reservado" : "Disponivel"}</span></div>
                <span className="muted">{item.domain}</span>
                {item.description && <p className="muted">{item.description}</p>}
                <div className="row">
                  <a className="button" href={item.original_url} target="_blank" rel="noreferrer">Ver produto na loja</a>
                  {!data.isOwner && !item.reserved && <button className="button primary" onClick={() => authAction(() => reserve(item.id))}>Reservar</button>}
                  {!data.isOwner && item.reserved_by_me && <button className="button" onClick={() => authAction(() => unreserve(item.id))}>Desfazer reserva</button>}
                  {data.isOwner && item.reserved && <button className="button danger" onClick={() => confirm("Remover a reserva deste item?") && authAction(() => unreserve(item.id))}>Remover reserva</button>}
                  {data.isOwner && <button className="button danger" onClick={() => remove(item.id)}>Excluir</button>}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
      {data.isOwner && <Link className="button" href="/painel">Voltar ao painel</Link>}
    </main>
  );
}
