import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/products';

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

function parseProductId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const productId = parseProductId((await params).id);
  const product = productId === null ? undefined : getProductById(productId);

  if (!product) return { title: 'Product not found' };

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const productId = parseProductId((await params).id);
  const product = productId === null ? undefined : getProductById(productId);

  if (!product) notFound();

  return (
    <div className="bg-slate-50">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 -z-20">
          <Image
            src={product.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/45" />

        <div className="mx-auto flex min-h-[28rem] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <Link
            href="/#products"
            className="mb-10 inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-200 transition-colors hover:text-brand-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All products
          </Link>

          <span
            className={`mb-5 w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
              product.status === 'Live'
                ? 'border-emerald-300/40 bg-emerald-950/75 text-emerald-200'
                : 'border-amber-300/40 bg-amber-950/75 text-amber-200'
            }`}
          >
            {product.status === 'Live' ? 'Live' : 'Coming soon'}
          </span>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {product.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
            {product.description}
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)] lg:gap-16 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">About the product</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">What is {product.name}?</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">{product.overview}</p>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">What you can expect</h2>
            <ul className="mt-5 space-y-4">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  {highlight}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Explore more from our team</h2>
            <p className="mt-1 text-sm text-slate-600">See the other products we are building.</p>
          </div>
          <Link
            href="/#products"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Browse all products <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
