'use client';

import { useEffect, useId, useState } from 'react';
import { Button, Field, Input, Modal, Textarea, useToast } from '@/components/ui';
import { useCreateService, useUpdateService } from '@/hooks/useServices';
import type { Service, ServiceInput } from '@/types/service';

const EMPTY: ServiceInput = { name: '', description: '', visitFee: 75, emergencyVisitFee: 110, isActive: true };

type Errors = Partial<Record<keyof ServiceInput, string>>;

function validate(input: ServiceInput): Errors {
  const errors: Errors = {};
  if (input.name.trim().length < 2) errors.name = 'Enter a name of at least 2 characters.';
  if (input.description.trim().length < 5) errors.description = 'Describe the service in a few words.';
  if (!(input.visitFee > 0)) errors.visitFee = 'Enter a fee above 0.';
  if (!(input.emergencyVisitFee > 0)) errors.emergencyVisitFee = 'Enter a fee above 0.';
  else if (input.emergencyVisitFee < input.visitFee)
    errors.emergencyVisitFee = 'The emergency fee cannot be lower than the normal visit fee.';
  return errors;
}

/** Add a new service, or edit `service` when one is given. */
export function ServiceFormDialog({
  open,
  onClose,
  service,
}: {
  open: boolean;
  onClose: () => void;
  service?: Service;
}) {
  const id = useId();
  const toast = useToast();
  const create = useCreateService();
  const update = useUpdateService();
  const [input, setInput] = useState<ServiceInput>(EMPTY);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setInput(
      service
        ? {
            name: service.name,
            description: service.description,
            visitFee: service.visitFee,
            emergencyVisitFee: service.emergencyVisitFee,
            isActive: service.isActive,
          }
        : EMPTY,
    );
  }, [open, service]);

  const errors = touched ? validate(input) : {};
  const saving = create.isPending || update.isPending;
  const set = <K extends keyof ServiceInput>(key: K, value: ServiceInput[K]) => setInput((v) => ({ ...v, [key]: value }));

  const save = () => {
    setTouched(true);
    if (Object.keys(validate(input)).length > 0) return;
    const done = {
      onSuccess: () => {
        toast(service ? `${input.name.trim()} updated` : `${input.name.trim()} added`);
        onClose();
      },
      onError: (err: Error) => toast(err.message || 'Could not save the service', 'error'),
    };
    if (service) update.mutate({ id: service.id, input }, done);
    else create.mutate(input, done);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={service ? `Edit ${service.name}` : 'Add a service'}
      description="Customers see the name, description and visit fee when they request help."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {service ? 'Save changes' : 'Add service'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Name" htmlFor={`${id}-name`} error={errors.name}>
          <Input
            id={`${id}-name`}
            value={input.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Solar & Inverters"
            invalid={Boolean(errors.name)}
          />
        </Field>
        <Field label="Description" htmlFor={`${id}-description`} error={errors.description}>
          <Textarea
            id={`${id}-description`}
            value={input.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What kind of problems does this service cover?"
            invalid={Boolean(errors.description)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Visit fee (USD)" htmlFor={`${id}-fee`} error={errors.visitFee}>
            <Input
              id={`${id}-fee`}
              type="number"
              min={1}
              step="0.01"
              value={Number.isNaN(input.visitFee) ? '' : input.visitFee}
              onChange={(e) => set('visitFee', e.target.valueAsNumber)}
              invalid={Boolean(errors.visitFee)}
            />
          </Field>
          <Field label="Emergency visit fee (USD)" htmlFor={`${id}-emergency`} error={errors.emergencyVisitFee}>
            <Input
              id={`${id}-emergency`}
              type="number"
              min={1}
              step="0.01"
              value={Number.isNaN(input.emergencyVisitFee) ? '' : input.emergencyVisitFee}
              onChange={(e) => set('emergencyVisitFee', e.target.valueAsNumber)}
              invalid={Boolean(errors.emergencyVisitFee)}
            />
          </Field>
        </div>
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
          <input
            type="checkbox"
            checked={input.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-500"
          />
          <span>
            <span className="block text-sm font-medium text-slate-900">Available to customers</span>
            <span className="block text-xs text-slate-500">Untick to hide it without deleting it.</span>
          </span>
        </label>
        {/* Lets Enter submit the form. */}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
