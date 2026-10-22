export interface Product {
  id: number;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  status: 'Live' | 'coming-soon';
  overview: string;
  highlights: string[];
}
