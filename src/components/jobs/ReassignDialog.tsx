'use client';

import { useEffect, useState } from 'react';
import { HardHat, Star } from 'lucide-react';
import { Avatar, Button, EmptyState, Modal, Spinner, useToast } from '@/components/ui';
import { useReassignJob } from '@/hooks/useJobs';
import { useTechnicians } from '@/hooks/useTechnicians';
import type { ServiceCategory } from '@/config/services';
import { cn } from '@/lib/utils';
import type { Job } from '@/types/job';

/**
 * Lets the admin present a job to a technician for customer negotiation. The customer,
 * not the system, decides whether to accept the terms and continue the job.
 */
export function ReassignDialog({ job, open, onClose }: { job: Job; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const reassign = useReassignJob();
  const [selected, setSelected] = useState<string | null>(null);
  const { data, isLoading } = useTechnicians({
    // Technician trades are the built-in services; a newly added service matches nobody yet.
    trade: job.service as ServiceCategory,
    verification: 'verified',
    status: 'active',
    pageSize: 100,
  });

  useEffect(() => {
    if (open) setSelected(null);
  }, [open]);

  const candidates = (data?.items ?? [])
    .filter((t) => t.id !== job.technician?.id)
    .sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable) || b.rating - a.rating);
  const chosen = candidates.find((t) => t.id === selected);

  const confirm = () => {
    if (!chosen) return;
    reassign.mutate(
      { id: job.id, technician: { id: chosen.id, name: chosen.name, phone: chosen.phone } },
      {
        onSuccess: () => {
          toast(`Customer negotiation for job ${job.reference} is now with ${chosen.name}`);
          onClose();
        },
        onError: (err) => toast(err.message || 'Could not reassign the job', 'error'),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={job.technician ? 'Present another technician' : 'Present technician to customer'}
      description={`Verified ${job.service} technicians are shown to the customer for negotiation. The customer decides whether the match proceeds.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={reassign.isPending}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={!chosen} loading={reassign.isPending}>
            {job.technician ? 'Present technician' : 'Send to customer'}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title="No technician available"
          description={`There is no other verified ${job.service} technician right now.`}
        />
      ) : (
        <fieldset>
          <legend className="sr-only">Choose a technician</legend>
          <ul className="space-y-2">
            {candidates.map((t) => (
              <li key={t.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                    selected === t.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <input
                    type="radio"
                    name="technician"
                    value={t.id}
                    checked={selected === t.id}
                    onChange={() => setSelected(t.id)}
                    className="h-4 w-4 accent-brand-500"
                  />
                  <Avatar name={t.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{t.name}</p>
                    <p className="truncate text-xs text-slate-500">{t.location}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className={t.isAvailable ? 'font-medium text-green-700' : 'text-slate-400'}>
                      {t.isAvailable ? 'LIVE' : 'Offline'}
                    </p>
                    <p className="inline-flex items-center gap-1 text-slate-500">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                      {t.rating.toFixed(1)} · {t.jobsCompleted} jobs
                    </p>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
    </Modal>
  );
}
