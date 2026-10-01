import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = { title: 'Create an account' };

export default function SignupPage() {
  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
      <p className="mt-2 text-sm text-slate-600">Get skilled help, or start receiving jobs as a Fundi.</p>
      <SignupForm />
      <p className="mt-8 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
