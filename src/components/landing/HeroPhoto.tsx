import Image from 'next/image';

/**
 * Hero photo: an electrician at work. Photo by Emmanuel Ikwuegbu on Unsplash
 * (https://unsplash.com/photos/-0-kl1BjvFc), free under the Unsplash License.
 */
export function HeroPhoto() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-200 via-brand-100 to-transparent blur-2xl" />

      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl">
        <Image
          src="/images/technician.jpg"
          alt="An electrician in a hard hat and work gloves repairing an electrical box"
          fill
          priority
          sizes="(min-width: 1024px) 576px, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
