import type { Metadata } from 'next';
import { Card, PageHeader } from '@/components/ui';
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_STYLE } from '@/config/services';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Categories' };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Service Categories"
        description={`The ${SERVICE_CATEGORIES.length} services Fundi offers to customers and technicians.`}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SERVICE_CATEGORIES.map((category) => {
          const { icon: Icon, className } = SERVICE_CATEGORY_STYLE[category];
          return (
            <Card key={category} className="p-5">
              <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', className)}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-900">{category}</p>
            </Card>
          );
        })}
      </div>
    </>
  );
}
