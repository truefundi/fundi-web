import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Fundi | Tell us what is wrong. Fundi finds who can fix it.',
    template: '%s | Fundi',
  },
  description:
    'Fundi connects customers who need repairs with qualified, available technicians: electrical, plumbing, HVAC, appliance, car and home repair.',
};

// The admin sidebar and top bar (AppShell) are added in src/app/admin/layout.tsx,
// so the public landing page is not wrapped in them.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
