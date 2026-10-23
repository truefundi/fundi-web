import type { Metadata } from 'next';
import { getProductById } from '@/lib/products';
import { ProductDetailsContent } from './ProductDetailsContent';

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
  return productId === null
    ? <div className="p-12 text-center">Product not found.</div>
    : <ProductDetailsContent productId={productId} />;
}
