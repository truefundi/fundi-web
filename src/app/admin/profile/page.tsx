
import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { ProfileDetailsForm } from '@/components/layout/ProfileForms';

export const metadata: Metadata = {
  title: 'My profile',
};

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        title="My profile"
        description="Manage your personal account details."
      />

      <div className="space-y-6">
        <ProfileDetailsForm />
      </div>
    </>
  );
}
