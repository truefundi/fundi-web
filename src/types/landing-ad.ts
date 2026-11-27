export interface LandingAd {
  id: string;
  productId: number;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  status: 'Coming soon' | 'Live';
  callToAction: string;
  isActive: boolean;
}

export type LandingAdInput = Omit<LandingAd, 'id' | 'productId'>;
