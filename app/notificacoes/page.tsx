"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { NotificationItem } from "@/components/notification-item";
import { Protected } from "@/components/protected";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/client-api";
import type { Notification } from "@/lib/types";

type NotificationList = { notifications: Notification[]; unreadCount: number };

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<NotificationList | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setData(await api("/api/notifications")); setError(""); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as notificações."); }
  }, []);
  useEffect(() => { if (!loading && user) load(); }, [load, loading, user]);

  async function openNotification(notification: Notification) {
    if (!notification.read_at) await api(`/api/notifications/${notification.id}`, { method: "PATCH" }).catch(() => undefined);
    window.dispatchEvent(new Event("notifications:refresh"));
    router.push(notification.href);
  }

  async function markAllAsRead() {
    await api("/api/notifications", { method: "PATCH" });
    setData((current) => current ? { ...current, unreadCount: 0, notifications: current.notifications.map((notification) => ({ ...notification, read_at: notification.read_at || new Date().toISOString() })) } : current);
    window.dispatchEvent(new Event("notifications:refresh"));
  }

  return (
    <Protected>
      <main className="page notifications-page">
        <Link className="icon-button page-nav-button" href="/painel" aria-label="Voltar para o painel" title="Voltar para o painel"><ArrowLeft size={20} aria-hidden /></Link>
        <header className="notifications-page-heading">
          <div><h1>Notificações</h1><p>Acompanhe novidades das listas e reservas dos seus itens.</p></div>
          {data && data.unreadCount > 0 && <button className="button" type="button" onClick={markAllAsRead}><CheckCheck size={18} aria-hidden />Marcar todas como lidas</button>}
        </header>
        {error ? <div className="empty" role="alert">{error} <button className="button compact" type="button" onClick={load}>Tentar novamente</button></div>
          : !data ? <div className="notifications-skeleton" aria-label="Carregando notificações"><span /><span /><span /></div>
            : data.notifications.length === 0 ? <div className="empty notifications-empty-state"><Bell size={24} aria-hidden /><strong>Nenhuma notificação por enquanto</strong><span>Quando uma lista seguida receber itens ou alguém reservar um item seu, você verá a novidade aqui.</span></div>
              : <div className="notifications-list">{data.notifications.map((notification) => <NotificationItem notification={notification} onOpen={openNotification} key={notification.id} />)}</div>}
      </main>
    </Protected>
  );
}
