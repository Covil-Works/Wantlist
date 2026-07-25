import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return <main className="page stack"><h1>Criar conta</h1><AuthForm mode="signup" /><p className="muted">Já tem conta? <Link href="/login">Entrar</Link>.</p></main>;
}
