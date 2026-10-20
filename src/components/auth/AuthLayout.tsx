import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/landing/Logo';

/** Shared frame for the log in and sign up screens: photo on the left, form on the right. */
export function AuthLayout({ children, logoSrc }: { children: React.ReactNode; logoSrc?: string }) {
  return (
    <div className="grid h-screen lg:grid-cols-2 overflow-hidden">
      <div className="relative hidden lg:block">
        <Image src="/images/welcome.jpg" alt="" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="text-3xl font-bold leading-tight text-white">
            Tell us what is wrong.
            <br />
            <span className="text-brand-400">Fundi finds who can fix it.</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col px-6 py-6 sm:px-12 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <Logo src={logoSrc} />
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to home
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-6">{children}</div>
      </div>
    </div>
  );
}
