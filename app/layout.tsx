import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { UserNav } from "@/components/user-nav";
import { NotificationMenu } from "@/components/notification-menu";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins"
});

export const metadata: Metadata = {
  title: "Wantlist",
  description: "Wishlists universais, compartilháveis e reserváveis."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body>
        <AuthProvider>
          <div className="shell">
            <header className="topbar">
              <div className="topbar-inner">
                <Link className="brand" href="/" aria-label="Wantlist">
                  <Image src="/logo-wl.png" alt="" width={74} height={54} priority />
                  <span className="sr-only">Wantlist</span>
                </Link>
                <div className="topbar-actions">
                  <NotificationMenu />
                  <UserNav />
                </div>
              </div>
            </header>
            {children}
            <footer className="site-footer">
              <div className="site-footer-inner">© 2026 MyWL - <a href="https://covildev.com" target="_blank" rel="noreferrer">Covil Dev</a>. Todos os direitos reservados.</div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
