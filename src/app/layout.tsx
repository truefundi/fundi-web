import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Fundi Admin',
    template: '%s | Fundi Admin',
  },
  description: 'Fundi skilled-service marketplace administration and operations portal.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
