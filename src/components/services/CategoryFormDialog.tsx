'use client';

import { useEffect, useId, useState } from 'react';
import { Car, House, Layers } from 'lucide-react';
import {
  Button,
  Field,
  Input,
  Modal,
  Textarea,
} from '@/components/ui';
import { SERVICE_GROUPS, type ServiceGroup } from '@/config/services';

export function CategoryFormDialog({
  open,
  onClose,
  existingNames,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  existingNames: string[];
  onSave: (category: { name: string; description: string; group?: ServiceGroup }) => void;
}) {
  const id = useId();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<ServiceGroup | ''>('Home Services');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setSelectedGroup('Home Services');
      setError('');
    }
  }, [open]);

  const save = () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError('Enter a category name of at least 2 characters.');
      return;
    }

    if (
      existingNames.some(
        (existing) => existing.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      setError('A category with this name already exists.');
      return;
    }

    if (!selectedGroup) {
      setError('Choose a service group (Home, Car, or Other).');
      return;
    }

    onSave({
      name: trimmedName,
      description: description.trim() || `${trimmedName} services`,
      group: selectedGroup,
    });
    onClose();
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
      label: 'Other',
      desc: 'Custom & other',
      icon: Layers,
    },
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a service category"
      description="Choose which group this category belongs to, then give it a name and description."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Add category</Button>
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
        <Field label="Service group" htmlFor={`${id}-category-group`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {SERVICE_GROUPS.map((group) => {
              const selected = selectedGroup === group;
              const meta = groupMeta[group];
              const GroupIcon = meta.icon;

              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setSelectedGroup(group)}
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

        <Field
          label="Category name"
          htmlFor={`${id}-name`}
          error={error}
        >
          <Input
            id={`${id}-name`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Electrical, Carpentry, Tire Repair"
            invalid={Boolean(error)}
          />
        </Field>

        <Field label="Description" htmlFor={`${id}-desc`}>
          <Textarea
            id={`${id}-desc`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what services fall under this category."
          />
        </Field>
      </form>
    </Modal>
  );
}