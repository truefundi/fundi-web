import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ dark = false, href = '/' }: { dark?: boolean; href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center"
      aria-label="Fundi home"
    >
      <Image
        src="/images/logo11.png"
        alt="Fundi"
        width={120}
        height={40}
        className="h-10 w-auto"
      />
    </Link>
  );
}
