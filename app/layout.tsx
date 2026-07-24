import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { UserNav } from "@/components/user-nav";

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
