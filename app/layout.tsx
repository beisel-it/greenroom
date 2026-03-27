import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Greenroom',
  description: 'Lean Backstage-style catalog and docs app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-chroma" aria-hidden="true" />
        <main className="app-shell">
          <header className="header">
            <div className="header-brand">
              <Link href="/" className="brand">Greenroom</Link>
              <span className="header-meta">Catalog workbench for docs, systems, components, and APIs</span>
            </div>
            <nav className="nav">
              <Link href="/catalog">Catalog</Link>
              <Link href="/docs">Docs</Link>
            </nav>
          </header>
          <div className="app-main">{children}</div>
        </main>
      </body>
    </html>
  );
}
