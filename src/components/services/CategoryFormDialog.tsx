'use client';

import { useEffect, useId, useState } from 'react';
import {
  Button,
  Field,
  Input,
  Modal,
  Textarea,
} from '@/components/ui';
import type { ServiceGroup } from '@/config/services';

export function CategoryFormDialog({
  open,
  onClose,
  existingNames,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  existingNames: string[];
  onSave: (category: {
    name: string;
    description: string;
    group?: ServiceGroup;
  }) => void;
}) {
  const id = useId();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
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

    onSave({
      name: trimmedName,
      description: description.trim() || `${trimmedName} services`,
      group: 'Home Services',
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a service category"
      description="Create a new category under Home Services by entering its name and description."
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
            placeholder="e.g. Electrical, Plumbing, Carpentry"
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
