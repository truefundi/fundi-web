import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Fundi | Tell us what is wrong. Fundi finds who can fix it.',
    template: '%s | Fundi',
  },
  description:
    'Fundi connects customers who need repairs with qualified, available technicians: electrical, plumbing, HVAC, appliance, car and home repair.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
