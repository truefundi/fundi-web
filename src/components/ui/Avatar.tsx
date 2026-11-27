'use client';

import { useEffect, useState } from 'react';
import { cn, initials } from '@/lib/utils';

const sizes = {
  sm: 'h-9 w-9 text-xs',
  lg: 'h-14 w-14 text-lg',
};

/** Avatar circle with optional profile picture and initials fallback. `inverse` is for use on the orange hero. */
export function Avatar({
  name,
  src,
  size = 'sm',
  inverse = false,
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  inverse?: boolean;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const showImage = Boolean(src && src.trim().length > 0 && !imgError);

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold',
        inverse ? 'bg-white text-brand-600' : 'bg-brand-50 text-brand-700',
        sizes[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={src!}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}