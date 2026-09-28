import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Fundi Platform - Admin & Management Dashboard',
  description: 'Fundi skilled-service marketplace administration and operation portal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Fundi Platform Inc. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
