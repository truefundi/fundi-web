
'use client';

import { useEffect, useId, useState } from 'react';
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  useToast,
} from '@/components/ui';
import {
  getServiceGroup,
  SERVICE_GROUPS,
  type ServiceGroup,
} from '@/config/services';
import { useCreateService, useUpdateService } from '@/hooks/useServices';
import type { Service, ServiceInput } from '@/types/service';

type ServiceFormValues = Omit<ServiceInput, 'category'> & {
  category: ServiceGroup | '';
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

function validate(input: ServiceFormValues): Errors {
  const errors: Errors = {};

  if (input.name.trim().length < 2) {
    errors.name = 'Enter a name of at least 2 characters.';
  }

  if (!input.category) {
    errors.category = 'Choose a category.';
  }

  if (input.description.trim().length < 5) {
    errors.description = 'Describe the service in a few words.';
  }

  if (!Number.isFinite(input.visitFee) || input.visitFee <= 0) {
    errors.visitFee = 'Enter a booking fee above 0.';
  }

  return errors;
}

/** Add a new service or edit an existing service. */
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

  const [input, setInput] = useState<ServiceFormValues>(EMPTY);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;

    setTouched(false);

    setInput(
      service
        ? {
            name: service.name,
            category: getServiceGroup(
              service.category ?? service.name,
            ),
            description: service.description,
            visitFee: service.visitFee,
            emergencyVisitFee: service.emergencyVisitFee,
            isActive: service.isActive,
          }
        : { ...EMPTY },
    );
  }, [open, service]);

  const errors = touched ? validate(input) : {};
  const saving = create.isPending || update.isPending;

  const set = <K extends keyof ServiceFormValues>(
    key: K,
    value: ServiceFormValues[K],
  ) => {
    setInput((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const save = () => {
    setTouched(true);

    if (Object.keys(validate(input)).length > 0) {
      return;
    }

    if (!input.category) return;

    const serviceInput: ServiceInput = {
      ...input,
      category: input.category,
    };

    const done = {
      onSuccess: () => {
        toast(
          service
            ? `${input.name.trim()} updated`
            : `${input.name.trim()} added`,
        );
        onClose();
      },
      onError: (err: Error) => {
        toast(
          err.message || 'Could not save the service',
          'error',
        );
      },
    };

    if (service) {
      update.mutate(
        { id: service.id, input: serviceInput },
        done,
      );
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
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>

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
        <Field
          label="Service name"
          htmlFor={`${id}-name`}
          error={errors.name}
        >
          <Input
            id={`${id}-name`}
            value={input.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder="e.g. Plumbing"
            invalid={Boolean(errors.name)}
          />
        </Field>

        <Field
          label="Category"
          htmlFor={`${id}-category`}
          error={errors.category}
        >
          <Select
            id={`${id}-category`}
            value={input.category}
            onChange={(event) =>
              set('category', event.target.value as ServiceGroup | '')
            }
            invalid={Boolean(errors.category)}
          >
            <option value="">Choose a category</option>
            {SERVICE_GROUPS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Description"
          htmlFor={`${id}-description`}
          error={errors.description}
        >
          <Textarea
            id={`${id}-description`}
            value={input.description}
            onChange={(event) =>
              set('description', event.target.value)
            }
            placeholder="Describe the service and what it covers."
            invalid={Boolean(errors.description)}
          />
        </Field>

        <Field
          label="Booking Fee (USD)"
          htmlFor={`${id}-fee`}
          error={errors.visitFee}
        >
          <Input
            id={`${id}-fee`}
            type="number"
            min={0.01}
            step="0.01"
            value={
              Number.isNaN(input.visitFee) ? '' : input.visitFee
            }
            onChange={(event) =>
              set('visitFee', event.target.valueAsNumber)
            }
            placeholder="Enter booking fee"
            invalid={Boolean(errors.visitFee)}
          />
          <p className="mt-1 text-xs text-slate-500">
            The fee customers pay to book this service.
          </p>
        </Field>

        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
          <input
            type="checkbox"
            checked={input.isActive}
            onChange={(event) =>
              set('isActive', event.target.checked)
            }
            className="mt-0.5 h-4 w-4 accent-brand-500"
          />

          <span>
            <span className="block text-sm font-medium text-slate-900">
              Available to customers
            </span>
            <span className="block text-xs text-slate-500">
              Untick to hide this service without deleting it.
            </span>
          </span>
        </label>

        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
