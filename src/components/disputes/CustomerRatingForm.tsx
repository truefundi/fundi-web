'use client';

import { useId, useMemo, useState } from 'react';
import { Button, Field, Input, Textarea, useToast } from '@/components/ui';
import { useRateTechnician } from '@/hooks/useDisputes';
import type { Job, Rating } from '@/types/job';

const CRITERIA: Array<{ key: keyof Pick<Rating, 'quality' | 'professionalism' | 'arrival' | 'communication' | 'value'>; label: string }> = [
  { key: 'quality', label: 'Quality' },
  { key: 'professionalism', label: 'Professionalism' },
  { key: 'arrival', label: 'Arrival' },
  { key: 'communication', label: 'Communication' },
  { key: 'value', label: 'Value' },
];

const emptyScores: Record<(typeof CRITERIA)[number]['key'], number> = {
  quality: 5,
  professionalism: 5,
  arrival: 5,
  communication: 5,
  value: 5,
};

export function CustomerRatingForm({ job }: { job: Job }) {
  const id = useId();
  const toast = useToast();
  const rateTechnician = useRateTechnician();
  const [scores, setScores] = useState(emptyScores);
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);

  const overall = useMemo(
    () => Number((CRITERIA.reduce((total, { key }) => total + scores[key], 0) / CRITERIA.length).toFixed(1)),
    [scores],
  );

  const valueError = touched && comment.trim().length < 10 ? 'Leave a short comment with at least 10 characters.' : undefined;

  const submit = () => {
    setTouched(true);
    if (comment.trim().length < 10) return;

    const rating: Rating = {
      overall,
      quality: scores.quality,
      professionalism: scores.professionalism,
      arrival: scores.arrival,
      communication: scores.communication,
      value: scores.value,
      comment: comment.trim(),
    };

    rateTechnician.mutate(
      { jobId: job.id, rating },
      {
        onSuccess: () => {
          toast(`Rating saved for ${job.technician?.name ?? 'the technician'}`);
        },
        onError: (err) => toast(err.message || 'Could not save the rating', 'error'),
      },
    );
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        <span className="font-medium text-slate-900">Customer:</span> {job.customer.name}
      </div>

      <div className="space-y-3">
        {CRITERIA.map(({ key, label }) => (
          <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <label htmlFor={`${id}-${key}`} className="text-sm font-medium text-slate-700">
              {label}
            </label>
            <Input
              id={`${id}-${key}`}
              type="number"
              min={1}
              max={5}
              step={1}
              value={scores[key]}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isNaN(next)) return;
                setScores((current) => ({ ...current, [key]: Math.min(5, Math.max(1, next)) }));
              }}
              className="w-20"
            />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
        Overall score: {overall}/5
      </div>

      <Field label="Customer comment" htmlFor={`${id}-comment`} error={valueError} hint="This will show with the technician rating.">
        <Textarea
          id={`${id}-comment`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="e.g. The technician arrived on time and explained the repair clearly."
          invalid={Boolean(valueError)}
        />
      </Field>

      <Button type="submit" className="w-full" loading={rateTechnician.isPending}>
        Save customer rating
      </Button>
    </form>
  );
}
