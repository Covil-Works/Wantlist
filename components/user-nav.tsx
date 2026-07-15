"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { Menu, X } from "lucide-react";
import { auth } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth-provider";

export function UserNav() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) return <nav className="nav"><span className="muted">Carregando</span></nav>;

  function navItems() {
    if (!user) {
      return (
        <>
          <Link className="button" href="/login" onClick={() => setOpen(false)}>Entrar</Link>
          <Link className="button primary" href="/cadastro" onClick={() => setOpen(false)}>Cadastro</Link>
        </>
      );
    }

    return (
      <>
        <Link className="button" href="/painel" onClick={() => setOpen(false)}>Painel</Link>
        <button className="button" onClick={() => { setOpen(false); signOut(auth); }}>Sair</button>
      </>
    );
  }

  return (
    <nav className="nav">
      <div className="nav-desktop">{navItems()}</div>
      <button className="icon-button nav-menu-button" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
      </button>
      {open && <div className="dropdown-menu nav-mobile-menu">{navItems()}</div>}
    </nav>
  );
}
