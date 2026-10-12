import type { Metadata } from 'next';
import { Faq } from '@/components/landing/Faq';

export const metadata: Metadata = {
  title: 'FAQ',
};

export default function FaqPage() {
  return <Faq />;
}
