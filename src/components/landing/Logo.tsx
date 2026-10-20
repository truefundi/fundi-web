import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ dark = false, href = '/', src }: { dark?: boolean; href?: string; src?: string }) {
  const logoSrc = src || "/images/logo11.png";
  return (
    <Link
      href={href}
      className="inline-flex items-center"
      aria-label="Fundi home"
    >
      <Image
        src={logoSrc}
        alt="Fundi"
        width={120}
        height={40}
        className="h-10 w-auto"
      />
    </Link>
  );
}
