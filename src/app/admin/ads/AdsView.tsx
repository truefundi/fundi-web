'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, Card, ConfirmDialog, EmptyState, PageHeader } from '@/components/ui';
import { LandingAdFormDialog } from '@/components/landing/LandingAdFormDialog';
import { useLandingAds } from '@/context/LandingAdsContext';
import type { LandingAd } from '@/types/landing-ad';

export function AdsView() {
  const { ads, isLoaded, storageError, saveAd, deleteAd } = useLandingAds();
  const [editing, setEditing] = useState<LandingAd | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<LandingAd | null>(null);
  const [actionError, setActionError] = useState('');

  function openForm(ad?: LandingAd) {
    setEditing(ad);
    setFormOpen(true);
  }

  function toggleActive(ad: LandingAd) {
    try {
      const { id, ...input } = ad;
      saveAd({ ...input, isActive: !ad.isActive }, id);
      setActionError('');
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not update the landing ad.');
    }
  }

  function confirmDelete() {
    if (!deleting) return;
    try {
      deleteAd(deleting.id);
      setDeleting(null);
      setActionError('');
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not delete the landing ad.');
    }
  }

  return (
    <>
      <PageHeader
        title="Landing page ads"
        description="Manage the promotion cards in the landing page product section."
        actions={
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4" aria-hidden /> Add ad
          </Button>
        }
      />

      
      {(storageError || actionError) && (
        <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError || storageError}
        </p>
      )}

      {!isLoaded ? (
        <Card className="p-8 text-center text-sm text-slate-500">Loading landing ads…</Card>
      ) : ads.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={Megaphone}
            title="No landing ads"
            description="Add a promotion card to display it on the landing page."
            action={<Button onClick={() => openForm()}>Add ad</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad) => (
            <Card key={ad.id} className="overflow-hidden">
              <div className="relative h-48 bg-slate-200">
                <Image src={ad.image} alt={ad.imageAlt} fill unoptimized sizes="(min-width: 1280px) 33vw, 50vw" className="object-cover" />
                <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${ad.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                  {ad.isActive ? 'Visible' : 'Hidden'}
                </span>
                <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${ad.status === 'Live' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {ad.status}
                </span>
              </div>
              <div className="p-5">
                <h2 className="text-lg font-semibold text-slate-900">{ad.title}</h2>
                <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">{ad.description}</p>
                <p className="mt-3 truncate text-xs text-slate-500">Product #{ad.productId} · /products/{ad.productId}</p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  <Button size="sm" variant="secondary" onClick={() => toggleActive(ad)}>
                    {ad.isActive ? 'Hide ad' : 'Show ad'}
                  </Button>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openForm(ad)} aria-label={`Edit ${ad.title}`}>
                      <Pencil className="h-4 w-4" aria-hidden /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setDeleting(ad)}
                      aria-label={`Delete ${ad.title}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <LandingAdFormDialog open={formOpen} onClose={() => setFormOpen(false)} ad={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.title ?? 'ad'}?`}
        description="This ad will be removed from the landing page."
        confirmLabel="Delete ad"
        destructive
        onConfirm={confirmDelete}
      />
    </>
  );
}
