import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const brand = process.env.NEXT_PUBLIC_BRAND_NAME || "Hayaurie";

export const metadata: Metadata = {
  title: { default: `${brand} Fine Jewelry`, template: `%s | ${brand}` },
  description: `Handcrafted jewelry by ${brand}, with an AI advisor to help you find the right piece.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="logo">{brand}</Link>
          <nav>
            <Link href="/advisor">AI Advisor</Link>
            <Link href="/gift">Gift Card</Link>
            <Link href="/custom">Custom Design</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>© {new Date().getFullYear()} {brand}. Handcrafted with care.</p>
          <p><Link href="/studio">Studio tools</Link></p>
        </footer>
      </body>
    </html>
  );
}
