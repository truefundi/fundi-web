'use client';

import { useEffect, useState } from 'react';
import { Percent } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, useToast } from '@/components/ui';
import {
  DEFAULT_COMMISSION_RATE_PERCENT,
  useCommissionSettings,
} from '@/context/CommissionSettingsContext';

export function SettingsView() {
  const toast = useToast();
  const { commissionRatePercent, isLoaded, storageError, setCommissionRatePercent } = useCommissionSettings();
  const [value, setValue] = useState(String(DEFAULT_COMMISSION_RATE_PERCENT));
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded) setValue(String(commissionRatePercent));
  }, [commissionRatePercent, isLoaded]);

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rate = Number(value);
    if (value.trim() === '' || !Number.isFinite(rate) || rate < 0 || rate > 100) {
      setError('Enter a commission rate from 0% to 100%.');
      return;
    }

    try {
      setCommissionRatePercent(rate);
      setError('');
      toast('Commission rate saved in this browser.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not save the commission rate.';
      setError(message);
      toast(message, 'error');
    }
  }

  function reset() {
    try {
      setCommissionRatePercent(DEFAULT_COMMISSION_RATE_PERCENT);
      setValue(String(DEFAULT_COMMISSION_RATE_PERCENT));
      setError('');
      toast('Commission rate reset to 30%.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not reset the commission rate.';
      setError(message);
      toast(message, 'error');
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage business rules for the Fundi platform." />

      <Card className="max-w-3xl">
        <CardHeader
          title="Commission rate"
          description="Set Fundi’s share of the visit fee. The remainder goes to the technician."
          action={
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Percent className="h-5 w-5" aria-hidden />
            </span>
          }
        />
        <CardBody>
          <form onSubmit={save} className="space-y-5">
            <Field
              label="Fundi commission (%)"
              htmlFor="commission-rate"
              hint="Enter a value from 0 to 100. Decimals are supported."
              error={error || storageError || undefined}
            >
              <Input
                id="commission-rate"
                type="number"
                min={0}
                max={100}
                step="0.1"
                inputMode="decimal"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setError('');
                }}
                disabled={!isLoaded}
                invalid={Boolean(error || storageError)}
                aria-describedby="commission-rate-note"
                required
              />
            </Field>

            <p id="commission-rate-note" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              This browser-stored mock setting updates commission estimates on payment and job details. It does not
              change recorded payment amounts or save a historical rate per job.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={!isLoaded}>
                Save commission rate
              </Button>
              <Button type="button" variant="secondary" onClick={reset} disabled={!isLoaded}>
                Reset to 30%
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
