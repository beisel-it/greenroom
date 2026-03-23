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
        <main>
          <header className="header">
            <Link href="/" className="brand">Greenroom</Link>
            <nav className="nav">
              <Link href="/catalog/platform">Catalog</Link>
              <Link href="/docs/getting-started/overview">Docs</Link>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
