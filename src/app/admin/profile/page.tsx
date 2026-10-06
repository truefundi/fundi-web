import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { ChangePasswordForm, ProfileDetailsForm } from '@/components/layout/ProfileForms';

export const metadata: Metadata = { title: 'My profile' };

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="My profile" description="Manage your account details and password." />
      <div className="space-y-6">
        <ProfileDetailsForm />
        <ChangePasswordForm />
      </div>
    </>
  );
}
