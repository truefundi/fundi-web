import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui';

export default function NotFound() {
  return (
    <Card>
      <EmptyState
        icon={SearchX}
        title="Page not found"
        description="The page you are looking for does not exist or has been moved."
        action={
          <Link href="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Back to dashboard
          </Link>
        }
      />
    </Card>
  );
}
