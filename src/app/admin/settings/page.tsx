import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Business rules for the whole platform."
      icon={Settings}
      actions={['Commission rate', 'Offer rules', 'Notifications', 'Admin team']}
    />
  );
}
