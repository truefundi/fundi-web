'use client';

import { useEffect, useId, useState } from 'react';
import { Button, Field, Input, Modal, Textarea } from '@/components/ui';
import type { AdminCategory } from '@/lib/catalog-admin-metadata';

export function CategoryFormDialog({
  open,
  category,
  existingNames,
  onClose,
  onSave,
}: {
  open: boolean;
  category?: AdminCategory;
  existingNames: string[];
  onClose: () => void;
  onSave: (category: AdminCategory) => void;
}) {
  const id = useId();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? '');
    setDescription(category?.description ?? '');
    setTouched(false);
  }, [open, category]);

  const normalizedName = name.trim().toLocaleLowerCase();
  const duplicate = existingNames.some(
    (existing) =>
      existing.trim().toLocaleLowerCase() === normalizedName &&
      existing !== category?.name,
  );
  const nameError = name.trim().length < 2
    ? 'Enter a category name of at least 2 characters.'
    : name.trim().length > 60
      ? 'Category names can be up to 60 characters.'
      : duplicate
        ? 'A category with this name already exists.'
        : undefined;
  const descriptionError = description.trim().length < 5
    ? 'Enter a description of at least 5 characters.'
    : undefined;

  const save = () => {
    setTouched(true);
    if (nameError || descriptionError) return;
    onSave({ name: name.trim(), description: description.trim() });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? 'Edit category' : 'Add category'}
      description="Create a category to organize related services."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{category ? 'Save changes' : 'Add category'}</Button>
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
          label="Category name"
          htmlFor={`${id}-name`}
          error={touched ? nameError : undefined}
        >
          <Input
            id={`${id}-name`}
            value={name}
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Plumbing Services"
            invalid={touched && Boolean(nameError)}
          />
        </Field>
        <Field
          label="Description"
          htmlFor={`${id}-description`}
          error={touched ? descriptionError : undefined}
        >
          <Textarea
            id={`${id}-description`}
            value={description}
            maxLength={2000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Briefly describe the services in this category."
            invalid={touched && Boolean(descriptionError)}
          />
        </Field>
      </form>
    </Modal>
  );
}
