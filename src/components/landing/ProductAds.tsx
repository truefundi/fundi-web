import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { getProducts } from '@/lib/products';

export function ProductAds() {
  const products = getProducts();

  return (
    <section id="products" className="scroll-mt-20 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow="More from our team"
          title="Explore our other products"
          description="Discover more tools and services built by our team."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.name}
              className="group relative isolate flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-950/20 sm:min-h-[25rem]"
            >
              <Image
                src={product.image}
                alt={product.imageAlt}
                fill
                sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="z-[-2] object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 z-[-1] bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent transition-colors group-hover:from-slate-950 group-hover:via-slate-950/70" />
              <span
                className={`absolute right-5 top-5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
                  product.status === 'Live'
                    ? 'border-emerald-300/40 bg-emerald-950/75 text-emerald-200'
                    : 'border-amber-300/40 bg-amber-950/75 text-amber-200'
                }`}
              >
                {product.status === 'Live' ? 'Live' : 'Coming soon'}
              </span>
              <div className="relative z-0 mt-auto flex flex-1 flex-col justify-end p-7 sm:p-8">
                <h3 className="text-2xl font-bold text-white [text-shadow:0_1px_4px_rgb(0_0_0_/_70%)]">{product.name}</h3>
                <p className="mt-3 max-w-prose text-base leading-7 text-white [text-shadow:0_1px_4px_rgb(0_0_0_/_80%)]">
                  {product.description}
                </p>
                <Link
                  href={`/products/${product.id}`}
                  className="mt-6 inline-flex items-center justify-between border-t border-white/25 pt-4 text-sm font-semibold text-brand-300 transition-colors hover:text-brand-200"
                >
                  Explore product <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
