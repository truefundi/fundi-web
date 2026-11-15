
'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  useToast,
} from '@/components/ui';
import { SERVICE_GROUPS, getServiceGroup } from '@/config/services';
import type { ServiceGroup } from '@/config/services';
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

function validate(
  input: ServiceFormValues,
  categories: string[],
): Errors {
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
  const [selectedGroup, setSelectedGroup] = useState<ServiceGroup | ''>('');
  const [iconData, setIconData] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [iconError, setIconError] = useState('');

  // Only show categories belonging to the selected service group.
  const filteredCategories = useMemo(
    () =>
      selectedGroup
        ? categories.filter(
            (category) => getServiceGroup(category) === selectedGroup,
          )
        : [],
    [categories, selectedGroup],
  );

  // Initialize the form whenever it opens or the selected service changes.
  useEffect(() => {
    if (!open) return;

    setTouched(false);
    setIconError('');
    setIconData(icon ?? null);

    if (service) {
      const group = getServiceGroup(service.category);

      setSelectedGroup(group);

      setInput({
        name: service.name,
        category: service.category,
        description: service.description,
        visitFee: service.visitFee,
        emergencyVisitFee: service.emergencyVisitFee,
        isActive: service.isActive,
      });
    } else {
      const group = initialCategory
        ? getServiceGroup(initialCategory)
        : '';

      setSelectedGroup(group);

      setInput({
        ...EMPTY,
        category: initialCategory ?? '',
      });
    }
  }, [open, service, initialCategory, icon]);

  const errors = touched
    ? validate(input, filteredCategories)
    : {};

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

  const handleGroupChange = (group: ServiceGroup) => {
    setSelectedGroup(group);

    // A category from the previous group must not remain selected.
    setInput((current) => ({
      ...current,
      category:
        current.category &&
        getServiceGroup(current.category) === group
          ? current.category
          : '',
    }));

    setTouched(false);
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

    reader.onerror = () => {
      setIconError('Could not read the selected image.');
    };

    reader.readAsDataURL(file);
  };

  const save = () => {
    setTouched(true);

    const validationErrors = validate(input, filteredCategories);

    if (
      !selectedGroup ||
      Object.keys(validationErrors).length > 0 ||
      iconError
    ) {
      return;
    }

    const serviceInput: ServiceInput = {
      ...input,
      name: input.name.trim(),
      category: input.category,
      description: input.description.trim(),
    };

    const done = {
      onSuccess: (saved: Service) => {
        const iconSaved =
          iconData === (icon ?? null) ||
          onIconChange(saved.id, iconData);

        toast(
          iconSaved
            ? service
              ? `${input.name.trim()} updated`
              : `${input.name.trim()} added`
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
      update.mutate(
        {
          id: service.id,
          input: serviceInput,
        },
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
      description="Choose a service group, select its category, and enter the service details and booking fee."
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            onClick={save}
            loading={saving}
            disabled={saving}
          >
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
        {/* Service group selection */}
        <Field label="Service group" htmlFor={`${id}-service-group`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SERVICE_GROUPS.map((group) => {
              const selected = selectedGroup === group;

              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => handleGroupChange(group)}
                  aria-pressed={selected}
                  className={`min-w-0 rounded-xl border p-4 text-left transition ${
                    selected
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-900">
                    {group}
                  </span>

                  <span className="mt-1 block text-xs text-slate-500">
                    {group === 'Home Services'
                      ? 'Services for homes and buildings'
                      : 'Services for cars and trucks'}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Service name */}
        <Field
          label="Service name"
          htmlFor={`${id}-name`}
          error={errors.name}
        >
          <Input
            id={`${id}-name`}
            value={input.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder="e.g. Pipe Leak Detection & Repair"
            invalid={Boolean(errors.name)}
          />
        </Field>

        {/* Category filtered by selected group */}
        <Field
          label="Category"
          htmlFor={`${id}-category`}
          error={errors.category}
        >
          <Select
            id={`${id}-category`}
            value={input.category}
            onChange={(event) => set('category', event.target.value)}
            disabled={!selectedGroup}
            invalid={Boolean(errors.category)}
          >
            <option value="">
              {selectedGroup
                ? 'Choose a category'
                : 'Select a service group first'}
            </option>

            {filteredCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Field>

        {/* Description */}
        <Field
          label="Description"
          htmlFor={`${id}-description`}
          error={errors.description}
        >
          <Textarea
            id={`${id}-description`}
            value={input.description}
            onChange={(event) => set('description', event.target.value)}
            placeholder="Describe the service and what it covers."
            invalid={Boolean(errors.description)}
          />
        </Field>

        {/* Booking fee */}
        <Field
          label="Booking Fee (RWF)"
          htmlFor={`${id}-fee`}
          error={errors.visitFee}
        >
          <Input
            id={`${id}-fee`}
            type="number"
            min={0}
            step="1"
            value={Number.isNaN(input.visitFee) ? '' : input.visitFee}
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

        {/* Service icon */}
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
              style={{
                backgroundImage: `url("${iconData}")`,
              }}
            />

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIconData(null)}
            >
              Remove icon
            </Button>
          </div>
        )}

        {/* Availability */}
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
      </form>
    </Modal>
  );
}
