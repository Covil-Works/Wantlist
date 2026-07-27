import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const signupHref = next ? `/cadastro?next=${encodeURIComponent(next)}` : "/cadastro";

  return <main className="page stack"><h1>Entrar</h1><AuthForm mode="login" /><p className="muted">Ainda não tem conta? <Link href={signupHref}>Criar cadastro</Link>.</p></main>;
}
