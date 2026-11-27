'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useLandingAds } from '@/context/LandingAdsContext';
import { getProductById } from '@/lib/products';

export function ProductDetailsContent({ productId }: { productId: number }) {
  const { ads, isLoaded } = useLandingAds();
  const product = getProductById(productId);
  const ad = ads.find((item) => item.productId === productId);

  if (!isLoaded) {
    return <div className="min-h-96 bg-slate-50" aria-label="Loading product" />;
  }

  if (!product && !ad) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Product not found</h1>
        <p className="mt-3 text-slate-600">This product may have been removed.</p>
        <Link href="/#products" className="mt-6 inline-flex rounded-lg bg-brand-500 px-5 py-3 font-semibold text-white hover:bg-brand-600">
          Browse products
        </Link>
      </div>
    );
  }

  const name = product?.name ?? ad!.title;
  const description = product?.description ?? ad!.description;
  const image = product?.image ?? ad!.image;
  const imageAlt = product?.imageAlt ?? ad!.imageAlt;
  const overview = product?.overview ?? ad!.description;
  const highlights = product?.highlights ?? [];

  return (
    <div className="bg-slate-50">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 -z-20">
          <Image src={image} alt="" fill priority sizes="100vw" unoptimized className="object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/45" />

        <div className="mx-auto flex min-h-[28rem] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <Link href="/#products" className="mb-10 inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-200 transition-colors hover:text-brand-300">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All products
          </Link>
          <span className="mb-5 w-fit rounded-full border border-brand-300/40 bg-slate-950/75 px-3 py-1 text-xs font-semibold text-brand-200">
            {ad?.status ?? (product ? (product.status === 'Live' ? 'Live' : 'Coming soon') : 'Coming soon')}
          </span>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{name}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">{description}</p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)] lg:gap-16 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">About the product</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">What is {name}?</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">{overview}</p>
          </div>

          {highlights.length > 0 && (
            <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">What you can expect</h2>
              <ul className="mt-5 space-y-4">
                {highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Explore more from our team</h2>
            <p className="mt-1 text-sm text-slate-600">See the other products we are building.</p>
          </div>
          <Link href="/#products" className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
            Browse all products <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
