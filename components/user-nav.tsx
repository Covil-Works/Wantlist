"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { CircleUserRound, LayoutDashboard, LogOut, Menu, UserRound, X } from "lucide-react";
import { auth } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth-provider";

export function UserNav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  if (!user) {
    return (
      <nav className="nav">
        <div className="nav-desktop">
          <Link className="button" href="/login">Entrar</Link>
          <Link className="button primary" href="/cadastro">Cadastro</Link>
        </div>
        <div className="menu-wrap" ref={menuRef}>
          <button className="icon-button nav-menu-button" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} aria-controls="guest-menu" onClick={() => setOpen((value) => !value)}>
            {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>
          {open && (
            <div className="dropdown-menu nav-mobile-menu" id="guest-menu" role="menu">
              <Link className="menu-option" href="/login" onClick={() => setOpen(false)} role="menuitem">
                <UserRound size={18} aria-hidden />
                <span><strong>Entrar</strong></span>
              </Link>
              <Link className="menu-option" href="/cadastro" onClick={() => setOpen(false)} role="menuitem">
                <CircleUserRound size={18} aria-hidden />
                <span><strong>Cadastro</strong></span>
              </Link>
            </div>
          )}
        </div>
      </nav>
    );
  }

  return (
    <nav className="nav">
      <div className="menu-wrap" ref={menuRef}>
        <button className="icon-button" aria-label={open ? "Fechar menu do usuario" : "Abrir menu do usuario"} aria-expanded={open} aria-controls="user-menu" onClick={() => setOpen((value) => !value)}>
          <CircleUserRound size={19} aria-hidden />
        </button>
        {open && (
          <div className="dropdown-menu nav-user-menu" id="user-menu" role="menu">
            <Link className="menu-option" href="/perfil" onClick={() => setOpen(false)} role="menuitem">
              <UserRound size={18} aria-hidden />
              <span><strong>Perfil</strong></span>
            </Link>
            <Link className="menu-option" href="/painel" onClick={() => setOpen(false)} role="menuitem">
              <LayoutDashboard size={18} aria-hidden />
              <span><strong>Painel</strong></span>
            </Link>
            <button className="menu-option" onClick={() => { setOpen(false); signOut(auth); }} role="menuitem">
              <LogOut size={18} aria-hidden />
              <span><strong>Sair</strong></span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
