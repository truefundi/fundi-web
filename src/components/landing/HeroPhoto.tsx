import Image from 'next/image';

/**
 * Hero photo: an electrician at work. Photo by Emmanuel Ikwuegbu on Unsplash
 * (https://unsplash.com/photos/-0-kl1BjvFc), free under the Unsplash License.
 */
export function HeroPhoto() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 lg:left-[34%]">
        <Image
          src="/images/technician.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="object-cover object-[58%_center] opacity-35 lg:opacity-100"
        />
      </div>
      <div className="absolute inset-0 bg-slate-950/45 lg:hidden" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/35 lg:inset-y-0 lg:left-[28%] lg:bg-gradient-to-r lg:from-slate-950 lg:via-slate-950/60 lg:to-transparent" />
    </div>
  );
}
