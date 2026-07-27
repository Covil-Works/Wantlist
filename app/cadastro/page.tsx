import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return <main className="page stack"><h1>Criar conta</h1><AuthForm mode="signup" /><p className="muted">Já tem conta? <Link href={loginHref}>Entrar</Link>.</p></main>;
}
