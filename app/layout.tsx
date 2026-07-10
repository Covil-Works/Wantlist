import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { UserNav } from "@/components/user-nav";

export const metadata: Metadata = {
  title: "Wantlist",
  description: "Wishlists universais, compartilháveis e reserváveis."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <div className="shell">
            <header className="topbar">
              <div className="topbar-inner">
                <Link className="brand" href="/">Wantlist</Link>
                <UserNav />
              </div>
            </header>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
