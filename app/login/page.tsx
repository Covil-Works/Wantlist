import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return <main className="page stack"><h1>Entrar</h1><AuthForm mode="login" /><p className="muted">Ainda nao tem conta? <Link href="/cadastro">Criar cadastro</Link>.</p></main>;
}
