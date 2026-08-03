"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { NotificationItem } from "@/components/notification-item";
import { api } from "@/lib/client-api";
import type { Notification } from "@/lib/types";

type NotificationSummary = {
  notifications: Notification[];
  total: number;
  unreadCount: number;
};

const EMPTY_SUMMARY: NotificationSummary = { notifications: [], total: 0, unreadCount: 0 };

export function NotificationMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<NotificationSummary>(EMPTY_SUMMARY);
  const menuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try { setSummary(await api("/api/notifications?limit=3")); }
    catch { /* O cabeçalho continua utilizável se as notificações estiverem indisponíveis. */ }
  }, [user]);

  useEffect(() => {
    if (!user) { setSummary(EMPTY_SUMMARY); return; }
    load();
    const interval = window.setInterval(load, 60_000);
    window.addEventListener("focus", load);
    window.addEventListener("notifications:refresh", load);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", load);
      window.removeEventListener("notifications:refresh", load);
    };
  }, [load, user]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!user) return null;

  async function openNotification(notification: Notification) {
    setOpen(false);
    setSummary((current) => ({
      ...current,
      unreadCount: notification.read_at ? current.unreadCount : Math.max(current.unreadCount - 1, 0),
      notifications: current.notifications.map((item) => item.id === notification.id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item),
    }));
    if (!notification.read_at) await api(`/api/notifications/${notification.id}`, { method: "PATCH" }).catch(() => undefined);
    router.push(notification.href);
  }

  return (
    <div className="menu-wrap notification-menu-wrap" ref={menuRef}>
      <button className="icon-button notification-button" type="button" aria-label={summary.unreadCount > 0 ? `Notificações: ${summary.unreadCount} não lidas` : "Notificações"} aria-expanded={open} aria-controls="notification-menu" onClick={() => { setOpen((value) => !value); if (!open) load(); }}>
        <Bell size={19} aria-hidden />
        {summary.unreadCount > 0 && <span className="notification-count" aria-hidden>{summary.unreadCount > 9 ? "9+" : summary.unreadCount}</span>}
      </button>
      {open && (
        <div className="dropdown-menu notification-dropdown dropdown-menu-viewport-centered" id="notification-menu" role="dialog" aria-label="Últimas notificações">
          <div className="notification-dropdown-heading">
            <strong>Notificações</strong>
            {summary.unreadCount > 0 && <span>{summary.unreadCount} {summary.unreadCount === 1 ? "nova" : "novas"}</span>}
          </div>
          {summary.notifications.length === 0
            ? <p className="notification-empty">Nenhuma notificação por enquanto.</p>
            : <div className="notification-dropdown-list">{summary.notifications.map((notification) => <NotificationItem notification={notification} onOpen={openNotification} key={notification.id} />)}</div>}
          {summary.total > 3 && <Link className="notification-see-all" href="/notificacoes" onClick={() => setOpen(false)}>Ver todas...</Link>}
        </div>
      )}
    </div>
  );
}
