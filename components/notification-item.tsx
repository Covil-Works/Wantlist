"use client";

import Link from "next/link";
import { Bell, Gift, Medal } from "lucide-react";
import type { Notification } from "@/lib/types";

function relativeTime(value: string) {
  const elapsedSeconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000], ["month", 2_592_000], ["week", 604_800],
    ["day", 86_400], ["hour", 3_600], ["minute", 60],
  ];
  for (const [unit, seconds] of ranges) {
    if (Math.abs(elapsedSeconds) >= seconds) return formatter.format(Math.round(elapsedSeconds / seconds), unit);
  }
  return "agora";
}

export function NotificationItem({ notification, onOpen }: { notification: Notification; onOpen: (notification: Notification) => void }) {
  const Icon = notification.type === "new_items" ? Gift : notification.type === "podium_item_reserved" ? Medal : Bell;
  return (
    <Link className={`notification-item${notification.read_at ? "" : " unread"}`} href={notification.href} onClick={(event) => { event.preventDefault(); onOpen(notification); }}>
      <span className="notification-item-icon"><Icon size={18} aria-hidden /></span>
      <span className="notification-item-copy">
        <span>{notification.message}</span>
        <time dateTime={notification.created_at}>{relativeTime(notification.created_at)}</time>
      </span>
      {!notification.read_at && <span className="notification-unread-dot"><span className="sr-only">Não lida</span></span>}
    </Link>
  );
}
