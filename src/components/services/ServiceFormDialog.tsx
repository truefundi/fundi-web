'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Car, House, Layers } from 'lucide-react';
import {
  Button,
  Field,
  Input,
  Modal,
  Textarea,
  useToast,
} from '@/components/ui';
import {
  SERVICE_GROUPS,
  getServiceGroup,
  isServiceGroupName,
} from '@/config/services';
import type { ServiceGroup } from '@/config/services';
import type {
  CatalogCategory,
  Service,
  ServiceInput,
} from '@/types/service';
import { useCreateService, useUpdateService } from '@/hooks/useServices';

const MAX_ICON_SIZE = 2 * 1024 * 1024;

type ServiceFormValues = ServiceInput;

const EMPTY: ServiceFormValues = {
  name: '',
  category: '',
  categoryId: '',
  description: '',
  visitFee: 75,
  emergencyVisitFee: 110,
  isActive: true,
};

type Errors = Partial<Record<keyof ServiceFormValues, string>>;

function validate(
  input: ServiceFormValues,
  categories: CatalogCategory[],
): Errors {
  const errors: Errors = {};

  if (input.name.trim().length < 2) {
    errors.name = 'Enter a name of at least 2 characters.';
  }

  const selectedCategory = categories.find(
    (category) => category.id === input.categoryId,
  );

  if (!selectedCategory) {
    errors.categoryId = 'No active catalog category is available for this group.';
  }

  if (input.description.trim().length < 5) {
    errors.description = 'Describe the service in a few words.';
  }

  if (!Number.isInteger(input.visitFee) || input.visitFee < 0) {
    errors.visitFee = 'Enter a whole booking fee of 0 or more.';
  }

  if (
    !Number.isInteger(input.emergencyVisitFee) ||
    input.emergencyVisitFee < 0
  ) {
    errors.emergencyVisitFee = 'Enter a valid emergency booking fee.';
  }

  return errors;
}

export function ServiceFormDialog({
  open,
  onClose,
  service,
  categories,
  initialCategory,
  icon,
  onIconChange,
  categoryGroups = {},
}: {
  open: boolean;
  onClose: () => void;
  service?: Service;
  categories: CatalogCategory[];
  initialCategory?: string;
  icon?: string;
  onIconChange: (serviceId: string, icon: string | null) => boolean;
  categoryGroups?: Record<string, ServiceGroup>;
}) {
  const id = useId();
  const toast = useToast();

  const create = useCreateService();
  const update = useUpdateService();

  const [input, setInput] = useState<ServiceFormValues>(EMPTY);
  const [selectedGroup, setSelectedGroup] = useState<ServiceGroup>('Home Services');
  const [iconData, setIconData] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [iconError, setIconError] = useState('');

  const availableCategories = useMemo<CatalogCategory[]>(() => {
    return (categories ?? []).filter((cat) => !isServiceGroupName(cat.name));
  }, [categories]);

  const resolveCategoryGroup = (
    categoryName?: string,
    fallbackName?: string,
  ): ServiceGroup => {
    const key = (categoryName ?? '').trim().toLowerCase();
    if (key && categoryGroups[key]) {
      return categoryGroups[key];
    }
    return getServiceGroup(categoryName || fallbackName);
  };

  const pickCategoryForGroup = (
    group: ServiceGroup,
    preferredId?: string,
    preferredName?: string,
  ): CatalogCategory | undefined => {
    const groupCats = availableCategories.filter(
      (cat) =>
        resolveCategoryGroup(cat.name) === group &&
        (cat.isActive || cat.id === preferredId),
    );
    const pool = groupCats.length > 0 ? groupCats : availableCategories;

    if (preferredId) {
      const byId = pool.find((c) => c.id === preferredId);
      if (byId) return byId;
    }
    if (preferredName) {
      const byName = pool.find(
        (c) => c.name.toLowerCase() === preferredName.toLowerCase(),
      );
      if (byName) return byName;
    }
    return pool[0];
  };

  useEffect(() => {
    if (!open) return;

    setTouched(false);
    setIconError('');
    setIconData(icon ?? null);

    if (service) {
      const matched =
        availableCategories.find((item) => item.id === service.categoryId) ??
        availableCategories.find(
          (item) =>
            item.name.toLowerCase() === (service.category ?? '').toLowerCase(),
        );

      const group = resolveCategoryGroup(
        matched?.name || service.category,
        service.name,
      );
      setSelectedGroup(group);

      const target = pickCategoryForGroup(
        group,
        matched?.id ?? service.categoryId,
        matched?.name ?? service.category,
      );

      setInput({
        name: service.name,
        category: target?.name ?? service.category ?? '',
        categoryId: target?.id ?? service.categoryId ?? '',
        description: service.description,
        visitFee: service.visitFee,
        emergencyVisitFee: service.emergencyVisitFee,
        isActive: service.isActive,
        keywords: service.keywords ?? '',
        icon: service.icon ?? null,
        sosBookingFee: service.sosBookingFee ?? null,
      });
    } else {
      const group: ServiceGroup = initialCategory
        ? resolveCategoryGroup(initialCategory)
        : 'Home Services';
      setSelectedGroup(group);

      const defaultCat = pickCategoryForGroup(group, undefined, initialCategory);

      setInput({
        ...EMPTY,
        category: defaultCat?.name ?? '',
        categoryId: defaultCat?.id ?? '',
      });
    }
  }, [open, service, initialCategory, icon, availableCategories, categoryGroups]);

  const handleGroupChange = (group: ServiceGroup) => {
    setSelectedGroup(group);
    const nextCat = pickCategoryForGroup(group);

    setInput((current) => ({
      ...current,
      category: nextCat?.name ?? '',
      categoryId: nextCat?.id ?? '',
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
    const resolvedCat =
      availableCategories.find((c) => c.id === input.categoryId) ??
      pickCategoryForGroup(selectedGroup);

    const candidateInput: ServiceFormValues = {
      ...input,
      category: resolvedCat?.name ?? input.category,
      categoryId: resolvedCat?.id ?? input.categoryId,
    };

    const validationErrors = validate(candidateInput, availableCategories);

    if (Object.keys(validationErrors).length > 0 || iconError) {
      return;
    }

    const serviceInput: ServiceInput = {
      ...candidateInput,
      name: candidateInput.name.trim(),
      category: resolvedCat!.name,
      categoryId: resolvedCat!.id,
      description: candidateInput.description.trim(),
    };

    const done = {
      onSuccess: (saved: Service) => {
        onIconChange(saved.id, iconData);
        toast(
          service
            ? `${serviceInput.name} updated successfully`
            : `${serviceInput.name} added successfully`,
          'success',
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

  const errors = touched ? validate(input, availableCategories) : {};
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

  const groupMeta: Record<
    ServiceGroup,
    { label: string; desc: string; icon: typeof House }
  > = {
    'Home Services': {
      label: 'Home Services',
      desc: 'Homes & buildings',
      icon: House,
    },
    'Car Services': {
      label: 'Car Services',
      desc: 'Cars & trucks',
      icon: Car,
    },
    'Other Services': {
      label: 'Other Services',
      desc: 'Custom & other',
      icon: Layers,
    },
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={service ? `Edit ${service.name}` : 'Add a service'}
      description="Choose Home, Car, or Other, and enter the service details and booking fee."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
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
        <Field label="Service group" htmlFor={`${id}-service-group`} error={errors.categoryId}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {SERVICE_GROUPS.map((group) => {
              const selected = selectedGroup === group;
              const meta = groupMeta[group];
              const GroupIcon = meta.icon;

              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => handleGroupChange(group)}
                  aria-pressed={selected}
                  className={`min-w-0 rounded-xl border p-3.5 text-left transition ${
                    selected
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GroupIcon
                      className={`h-4 w-4 shrink-0 ${
                        selected ? 'text-brand-600' : 'text-slate-500'
                      }`}
                    />
                    <span className="block text-sm font-semibold text-slate-900">
                      {meta.label}
                    </span>
                  </div>

                  <span className="mt-1 block text-xs text-slate-500">
                    {meta.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Service name" htmlFor={`${id}-name`} error={errors.name}>
          <Input
            id={`${id}-name`}
            value={input.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder={
              selectedGroup === 'Car Services'
                ? 'e.g. Engine Diagnostics & Battery Replacement'
                : 'e.g. Pipe Leak Detection & Repair'
            }
            invalid={Boolean(errors.name)}
          />
        </Field>

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
            onChange={(event) => set('visitFee', event.target.valueAsNumber)}
            placeholder="Enter booking fee"
            invalid={Boolean(errors.visitFee)}
          />

          <p className="mt-1 text-xs text-slate-500">
            The fee customers pay to book this service.
          </p>
        </Field>

        <Field
          label="Emergency Booking Fee (RWF)"
          htmlFor={`${id}-emergency-fee`}
          error={errors.emergencyVisitFee}
        >
          <Input
            id={`${id}-emergency-fee`}
            type="number"
            min={0}
            step="1"
            value={
              Number.isNaN(input.emergencyVisitFee)
                ? ''
                : input.emergencyVisitFee
            }
            onChange={(event) =>
              set('emergencyVisitFee', event.target.valueAsNumber)
            }
            placeholder="Enter emergency booking fee"
            invalid={Boolean(errors.emergencyVisitFee)}
          />
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
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <div
              role="img"
              aria-label={`${input.name || 'Service'} icon preview`}
              className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-cover bg-center bg-no-repeat"
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

        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
          <input
            type="checkbox"
            checked={input.isActive}
            onChange={(event) => set('isActive', event.target.checked)}
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
