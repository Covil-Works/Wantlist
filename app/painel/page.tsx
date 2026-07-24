"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, EyeOff, Globe2, Heart, ListPlus, LockKeyhole, Settings, UserPlus, UsersRound } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Protected } from "@/components/protected";
import { api } from "@/lib/client-api";

type WishlistSummary = {
  public_code: string;
  title: string;
  visibility: string;
  item_count: number;
  reserved_count: number;
};

type FollowedWishlist = {
  public_code: string;
  title: string;
  owner_name: string;
  access_type: string;
  item_count: number;
};

type Dashboard = {
  profile: { display_name: string };
  wishlist: WishlistSummary | null;
  following: FollowedWishlist[];
};

const visibilityLabels: Record<string, string> = {
  public: "Publica",
  invited: "Convidados",
  private: "Privada",
};

const visibilityIcons = {
  public: Globe2,
  invited: UserPlus,
  private: LockKeyhole,
};

function visibilityLabel(value: string) {
  return visibilityLabels[value] || value;
}

function VisibilityIcon({ value }: { value: string }) {
  const Icon = visibilityIcons[value as keyof typeof visibilityIcons] || EyeOff;
  return <Icon size={14} aria-hidden />;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const next = await api("/api/dashboard");
    setData(next);
    setError("");
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    load().catch(() => setError("Complete seu perfil para acessar suas wishlists."));
  }, [load, loading, user]);

  async function createWishlist(event: React.FormEvent) {
    event.preventDefault();
    await api("/api/wishlist", { method: "POST", body: JSON.stringify({ title, visibility }) });
    await load();
  }

  return (
    <Protected>
      <main className="page dashboard-page">
        {error && <div className="empty">{error} <Link href="/onboarding">Ir para onboarding</Link></div>}
        {!data ? <div className="empty">Carregando suas wishlists.</div> : (
          <>
            <section className="dashboard-mine" aria-labelledby="my-lists-title">
              <div className="dashboard-section-heading">
                <h1 className="dashboard-title" id="my-lists-title">Minhas listas</h1>
                <Heart size={22} aria-hidden />
              </div>
              <div className="dashboard-owned" aria-labelledby="my-wishlist-title">
                {!data.wishlist ? (
                  <form className="dashboard-create" onSubmit={createWishlist}>
                    <div className="dashboard-owned-copy">
                      <span className="dashboard-label">Sua lista</span>
                      <h2 id="my-wishlist-title">Crie sua wishlist</h2>
                      <p className="muted">Uma lista unica para organizar produtos de qualquer loja e compartilhar quando quiser.</p>
                    </div>
                    <div className="dashboard-create-fields">
                      <label className="field"><span>Titulo</span><input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} /></label>
                      <label className="field"><span>Visibilidade</span><select className="select" value={visibility} onChange={(e) => setVisibility(e.target.value)}><option value="public">Qualquer pessoa</option><option value="invited">Somente convidados</option><option value="private">Somente eu</option></select></label>
                      <button className="button primary"><ListPlus size={18} aria-hidden />Criar wishlist</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="dashboard-owned-copy">
                      <h2 id="my-wishlist-title">{data.wishlist.title}</h2>
                      <Link className="dashboard-public-link" href={`/w/${data.wishlist.public_code}`}>/w/{data.wishlist.public_code}</Link>
                      <div className="dashboard-owned-details" aria-label="Resumo da minha wishlist">
                        <span><VisibilityIcon value={data.wishlist.visibility} />{visibilityLabel(data.wishlist.visibility)}</span>
                        <span>{data.wishlist.item_count} {data.wishlist.item_count === 1 ? "item" : "itens"}</span>
                        <span>{Math.max(data.wishlist.item_count - data.wishlist.reserved_count, 0)} disponiveis</span>
                        <span>{data.wishlist.reserved_count} reservados</span>
                      </div>
                    </div>
                    <div className="dashboard-actions">
                      <Link className="button primary" href={`/w/${data.wishlist.public_code}`}><ArrowUpRight size={18} aria-hidden />Abrir wishlist</Link>
                      <Link className="button" href="/wishlist/configuracoes"><Settings size={17} aria-hidden />Configurar</Link>
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="dashboard-following" aria-labelledby="following-title">
              <div className="dashboard-section-heading">
                <div>
                  <h2 id="following-title">Wishlists que sigo</h2>
                  <p className="muted">{data.following.length === 0 ? "Listas publicas ou convites aceitos aparecem aqui." : `${data.following.length} ${data.following.length === 1 ? "lista acompanhada" : "listas acompanhadas"}.`}</p>
                </div>
                <UsersRound size={22} aria-hidden />
              </div>

              {data.following.length === 0 ? (
                <div className="empty dashboard-empty-following">Nenhuma wishlist acompanhada ainda. Abra uma lista publica ou aceite um convite para acompanhar por aqui.</div>
              ) : (
                <div className="dashboard-following-list">
                  {data.following.map((w) => (
                    <Link className="dashboard-following-row" href={`/w/${w.public_code}`} key={w.public_code}>
                      <span className="dashboard-following-main">
                        <strong>{w.title}</strong>
                        <span className="muted">De {w.owner_name} - {w.item_count} {w.item_count === 1 ? "item" : "itens"}</span>
                      </span>
                      <span className="badge">{w.access_type}</span>
                      <ArrowUpRight size={18} aria-hidden />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </Protected>
  );
}
