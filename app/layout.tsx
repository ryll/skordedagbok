import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { getUser } from "@/lib/data";
import { logout } from "@/app/actions";
import ServiceWorkerRegistration from "@/components/service-worker-registration";

export const metadata: Metadata = {
  title: { default: "Skördedagbok", template: "%s | Skördedagbok" },
  description: "Skördar från balkongen, samlade på ett ställe.",
  applicationName: "Skördedagbok",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Skördedagbok" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#244b35", colorScheme: "light" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  return <html lang="sv"><body>
    <header className="site-header"><div className="container header-inner">
      <Link className="brand" href="/">Skördedagbok</Link>
      <nav className="nav" aria-label="Huvudmeny">
        <Link href="/">Översikt</Link><Link href="/skordar">Skördar</Link>
        {user ? <><Link href="/admin">Administrera</Link><form action={logout}><button className="secondary" type="submit">Logga ut</button></form></> : <Link href="/logga-in">Logga in</Link>}
      </nav>
    </div></header>
    <main className="container">{children}</main>
    <footer className="site-footer"><div className="container"></div></footer>
    <ServiceWorkerRegistration />
  </body></html>;
}
