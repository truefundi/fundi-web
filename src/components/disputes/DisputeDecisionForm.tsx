'use client';

import { useId, useState } from 'react';
import { Button, Field, Input, Textarea, useToast } from '@/components/ui';
import { useResolveDispute } from '@/hooks/useDisputes';
import { approvedTotal, billedTotal, formatMoney } from '@/lib/jobs';
import { cn } from '@/lib/utils';
import { DISPUTE_OUTCOME_LABEL, type DisputeOutcome, type Job } from '@/types/job';

const OUTCOMES: { value: DisputeOutcome; hint: string }[] = [
  { value: 'customer', hint: 'Only work the customer approved is paid' },
  { value: 'technician', hint: 'Everything the technician billed is paid' },
  { value: 'partial', hint: 'You set a fair amount in between' },
];

/** The admin's decision on an open dispute: who is right, what is paid, and why. */
export function DisputeDecisionForm({ job }: { job: Job }) {
  const id = useId();
  const toast = useToast();
  const resolve = useResolveDispute();
  const billed = billedTotal(job);
  const approved = approvedTotal(job);

  const suggested = (outcome: DisputeOutcome) =>
    outcome === 'customer' ? approved : outcome === 'technician' ? billed : Math.round((approved + billed) / 2);

  const [outcome, setOutcome] = useState<DisputeOutcome | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);

  const value = Number(amount);
  const errors = {
    outcome: touched && !outcome ? 'Choose an outcome.' : undefined,
    amount:
      touched && (amount === '' || !Number.isFinite(value) || value < 0 || value > billed)
        ? `Enter an amount from $0 to ${formatMoney(billed)}.`
        : undefined,
    note: touched && note.trim().length < 10 ? 'Explain the decision in at least 10 characters. Both sides will see it.' : undefined,
  };

  const choose = (next: DisputeOutcome) => {
    setOutcome(next);
    setAmount(String(suggested(next)));
  };

  const submit = () => {
    setTouched(true);
    if (!outcome || errors.amount || note.trim().length < 10 || amount === '') return;
    resolve.mutate(
      { jobId: job.id, decision: { outcome, amount: value, note } },
      {
        onSuccess: () => toast(`Dispute on ${job.reference} resolved`),
        onError: (err) => toast(err.message || 'Could not resolve the dispute', 'error'),
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
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Decision</legend>
        <div className="mt-2 space-y-2">
          {OUTCOMES.map((o) => (
            <label
              key={o.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                outcome === o.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50',
              )}
            >
              <input
                type="radio"
                name="outcome"
                value={o.value}
                checked={outcome === o.value}
                onChange={() => choose(o.value)}
                className="mt-0.5 h-4 w-4 accent-brand-500"
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">{DISPUTE_OUTCOME_LABEL[o.value]}</span>
                <span className="block text-xs text-slate-500">
                  {o.hint} · {formatMoney(suggested(o.value))}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors.outcome && (
          <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
            {errors.outcome}
          </p>
        )}
      </fieldset>

      <Field
        label="Repair amount to settle (USD)"
        htmlFor={`${id}-amount`}
        error={errors.amount}
        hint="The visit fee is separate and already paid."
      >
        <Input
          id={`${id}-amount`}
          type="number"
          min={0}
          max={billed}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          invalid={Boolean(errors.amount)}
        />
      </Field>

      <Field label="Reason for the decision" htmlFor={`${id}-note`} error={errors.note} hint="The customer and technician will see this.">
        <Textarea
          id={`${id}-note`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. The extra gasket was not approved by the customer, so it is not charged."
          invalid={Boolean(errors.note)}
        />
      </Field>

      <Button type="submit" className="w-full" loading={resolve.isPending}>
        Resolve dispute
      </Button>
    </form>
  );
}
