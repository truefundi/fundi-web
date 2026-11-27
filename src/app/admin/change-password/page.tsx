
import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { ChangePasswordForm } from '@/components/layout/ProfileForms';

export const metadata: Metadata = {
  title: 'Change password',
};

export default function ChangePasswordPage() {
  return (
    <>
      <PageHeader
        title="Change password"
        description="Update your password to keep your account secure."
      />

      <div className="space-y-6">
        <ChangePasswordForm />
      </div>
    </>
  );
}
