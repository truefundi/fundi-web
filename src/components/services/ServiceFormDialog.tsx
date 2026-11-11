'use client';

import { useEffect, useId, useState } from 'react';
import { Button, Field, Input, Modal, Select, Textarea, useToast } from '@/components/ui';
import type { Service, ServiceInput } from '@/types/service';
import { useCreateService, useUpdateService } from '@/hooks/useServices';

const MAX_ICON_SIZE = 2 * 1024 * 1024;

type ServiceFormValues = Omit<ServiceInput, 'category'> & {
  category: string;
};

const EMPTY: ServiceFormValues = {
  name: '',
  category: '',
  description: '',
  visitFee: 75,
  emergencyVisitFee: 110,
  isActive: true,
};

type Errors = Partial<Record<keyof ServiceFormValues, string>>;

function validate(input: ServiceFormValues, categories: string[]): Errors {
  const errors: Errors = {};

  if (input.name.trim().length < 2) {
    errors.name = 'Enter a name of at least 2 characters.';
  }
  if (!categories.includes(input.category)) {
    errors.category = 'Choose a category.';
  }
  if (input.description.trim().length < 5) {
    errors.description = 'Describe the service in a few words.';
  }
  if (!Number.isInteger(input.visitFee) || input.visitFee < 0) {
    errors.visitFee = 'Enter a whole booking fee of 0 or more.';
  }

  return errors;
}

/** Add a new service or edit an existing service. */
export function ServiceFormDialog({
  open,
  onClose,
  service,
  categories,
  initialCategory,
  icon,
  onIconChange,
}: {
  open: boolean;
  onClose: () => void;
  service?: Service;
  categories: string[];
  initialCategory?: string;
  icon?: string;
  onIconChange: (serviceId: string, icon: string | null) => boolean;
}) {
  const id = useId();
  const toast = useToast();
  const create = useCreateService();
  const update = useUpdateService();

  const [input, setInput] = useState<ServiceFormValues>(EMPTY);
  const [iconData, setIconData] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [iconError, setIconError] = useState('');

  useEffect(() => {
    if (!open) return;

    setTouched(false);
    setIconError('');
    setIconData(icon ?? null);
    setInput(
      service
        ? {
            name: service.name,
            category: service.category,
            description: service.description,
            visitFee: service.visitFee,
            emergencyVisitFee: service.emergencyVisitFee,
            isActive: service.isActive,
          }
        : { ...EMPTY, category: initialCategory ?? '' },
    );
  }, [open, service, initialCategory, icon]);

  const errors = touched ? validate(input, categories) : {};
  const saving = create.isPending || update.isPending;

  const set = <K extends keyof ServiceFormValues>(
    key: K,
    value: ServiceFormValues[K],
  ) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const chooseIcon = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setIconError('Choose an image file.');
      return;
    }
    if (file.size > MAX_ICON_SIZE) {
      setIconError('Choose an image smaller than 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setIconError('Could not read the selected image.');
        return;
      }
      setIconData(reader.result);
      setIconError('');
    };
    reader.onerror = () => setIconError('Could not read the selected image.');
    reader.readAsDataURL(file);
  };

  const save = () => {
    setTouched(true);
    if (Object.keys(validate(input, categories)).length > 0 || iconError) return;

    const serviceInput: ServiceInput = {
      ...input,
      name: input.name.trim(),
      category: input.category,
      description: input.description.trim(),
    };

    const done = {
      onSuccess: (saved: Service) => {
        const iconSaved =
          iconData === (icon ?? null) || onIconChange(saved.id, iconData);
        toast(
          iconSaved
            ? service ? `${input.name.trim()} updated` : `${input.name.trim()} added`
            : `${input.name.trim()} was saved, but its icon could not be stored in this browser`,
          iconSaved ? 'success' : 'error',
        );
        onClose();
      },
      onError: (err: Error) => {
        toast(err.message || 'Could not save the service', 'error');
      },
    };

    if (service) {
      update.mutate({ id: service.id, input: serviceInput }, done);
    } else {
      create.mutate(serviceInput, done);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={service ? `Edit ${service.name}` : 'Add a service'}
      description="Set up the service details and the booking fee customers pay to book it."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={saving}>
            {service ? 'Save changes' : 'Add service'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <Field label="Service name" htmlFor={`${id}-name`} error={errors.name}>
          <Input
            id={`${id}-name`}
            value={input.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder="e.g. Pipe Leak Detection & Repair"
            invalid={Boolean(errors.name)}
          />
        </Field>

        <Field label="Category" htmlFor={`${id}-category`} error={errors.category}>
          <Select
            id={`${id}-category`}
            value={input.category}
            onChange={(event) => set('category', event.target.value)}
            invalid={Boolean(errors.category)}
          >
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
        </Field>

        <Field label="Description" htmlFor={`${id}-description`} error={errors.description}>
          <Textarea
            id={`${id}-description`}
            value={input.description}
            onChange={(event) => set('description', event.target.value)}
            placeholder="Describe the service and what it covers."
            invalid={Boolean(errors.description)}
          />
        </Field>

        <Field label="Booking Fee (RWF)" htmlFor={`${id}-fee`} error={errors.visitFee}>
          <Input
            id={`${id}-fee`}
            type="number"
            min={0}
            step="1"
            value={Number.isNaN(input.visitFee) ? '' : input.visitFee}
            onChange={(event) => set('visitFee', event.target.valueAsNumber)}
            placeholder="Enter booking fee"
            invalid={Boolean(errors.visitFee)}
          />
          <p className="mt-1 text-xs text-slate-500">The fee customers pay to book this service.</p>
        </Field>

        <Field
          label="Service icon"
          htmlFor={`${id}-icon`}
          hint="Upload an image from this device (max 2 MB). The icon is saved in this browser."
          error={iconError}
        >
          <Input
            id={`${id}-icon`}
            type="file"
            accept="image/*"
            onChange={(event) => chooseIcon(event.target.files?.[0])}
            invalid={Boolean(iconError)}
          />
        </Field>

        {iconData && (
          <div className="flex items-center gap-3">
            <div
              role="img"
              aria-label={`${input.name || 'Service'} icon preview`}
              className="h-14 w-14 rounded-xl border border-slate-200 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${iconData}")` }}
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => setIconData(null)}>
              Remove icon
            </Button>
          </div>
        )}

        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
          <input
            type="checkbox"
            checked={input.isActive}
            onChange={(event) => set('isActive', event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-500"
          />
          <span>
            <span className="block text-sm font-medium text-slate-900">Available to customers</span>
            <span className="block text-xs text-slate-500">Untick to hide this service without deleting it.</span>
          </span>
        </label>
      </form>
    </Modal>
  );
}
