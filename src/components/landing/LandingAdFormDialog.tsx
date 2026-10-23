'use client';

import { useEffect, useId, useState } from 'react';
import Image from 'next/image';
import { Button, Field, Input, Modal, Select, Textarea, useToast } from '@/components/ui';
import type { LandingAd, LandingAdInput } from '@/types/landing-ad';
import { useLandingAds } from '@/context/LandingAdsContext';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

type FormValues = LandingAdInput;
type Errors = Partial<Record<keyof FormValues, string>>;

const EMPTY: FormValues = {
  title: '',
  description: '',
  image: '',
  imageAlt: '',
  status: 'Coming soon',
  callToAction: 'Learn more',
  isActive: true,
};

function validate(values: FormValues): Errors {
  const errors: Errors = {};
  if (values.title.trim().length < 2) errors.title = 'Enter a title of at least 2 characters.';
  if (values.description.trim().length < 5) errors.description = 'Enter a description of at least 5 characters.';
  if (!values.image.trim()) errors.image = 'Enter an image path or URL.';
  if (!values.callToAction.trim()) errors.callToAction = 'Enter the link text.';
  return errors;
}

export function LandingAdFormDialog({
  open,
  onClose,
  ad,
}: {
  open: boolean;
  onClose: () => void;
  ad?: LandingAd;
}) {
  const id = useId();
  const toast = useToast();
  const { saveAd, nextProductId } = useLandingAds();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!open) return;
    setValues(ad ? {
      title: ad.title,
      description: ad.description,
      image: ad.image,
      imageAlt: `${ad.title} promotional image`,
      status: ad.status,
      callToAction: ad.callToAction,
      isActive: ad.isActive,
    } : EMPTY);
    setTouched(false);
    setSaveError('');
  }, [open, ad]);

  const errors = touched ? validate(values) : {};
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === 'title' ? { imageAlt: `${String(value).trim() || 'Product'} promotional image` } : {}),
    }));
    setSaveError('');
  };

  function uploadImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSaveError('Choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setSaveError('Choose an image smaller than 2 MB so it can be saved in this browser.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setSaveError('Could not read the selected image.');
        return;
      }
      set('image', reader.result);
    };
    reader.onerror = () => setSaveError('Could not read the selected image.');
    reader.readAsDataURL(file);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(validate(values)).length > 0) return;
    try {
      const title = values.title.trim();
      saveAd({
        ...values,
        title,
        description: values.description.trim(),
        imageAlt: `${title} promotional image`,
      }, ad?.id);
      toast(ad ? 'Landing ad updated in this browser.' : 'Landing ad added in this browser.');
      onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not save the landing ad.';
      setSaveError(message);
      toast(message, 'error');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={ad ? `Edit ${ad.title}` : 'Add landing ad'}
      description="Update a promotion card shown in the landing page product section."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form={`${id}-form`}>{ad ? 'Save changes' : 'Add ad'}</Button>
        </>
      }
    >
      <form id={`${id}-form`} onSubmit={save} className="space-y-4">
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900">
          Product number and link are assigned automatically: <span className="font-semibold">/products/{ad?.productId ?? nextProductId}</span>
        </p>
        <Field label="Title" htmlFor={`${id}-title`} error={errors.title}>
          <Input
            id={`${id}-title`}
            value={values.title}
            onChange={(event) => set('title', event.target.value)}
            maxLength={80}
            placeholder="e.g. HomesHub"
            invalid={Boolean(errors.title)}
          />
        </Field>
        <Field label="Description" htmlFor={`${id}-description`} error={errors.description}>
          <Textarea
            id={`${id}-description`}
            value={values.description}
            onChange={(event) => set('description', event.target.value)}
            maxLength={300}
            placeholder="Describe what you are promoting."
            invalid={Boolean(errors.description)}
          />
        </Field>
        <Field label="Status" htmlFor={`${id}-status`}>
          <Select
            id={`${id}-status`}
            value={values.status}
            onChange={(event) => set('status', event.target.value as FormValues['status'])}
          >
            <option value="Coming soon">Coming soon</option>
            <option value="Live">Live</option>
          </Select>
        </Field>
        <Field
          label="Image path or URL"
          htmlFor={`${id}-image`}
          hint="Use an existing image path or public HTTPS URL, or upload an image below (max 2 MB)."
          error={errors.image}
        >
          <Input
            id={`${id}-image`}
            value={values.image}
            onChange={(event) => set('image', event.target.value)}
            placeholder="/images/real-estate-market.png"
            invalid={Boolean(errors.image)}
          />
        </Field>
        <Field label="Upload image from this device" htmlFor={`${id}-image-file`}>
          <Input
            id={`${id}-image-file`}
            type="file"
            accept="image/*"
            onChange={(event) => uploadImage(event.target.files?.[0])}
          />
        </Field>
        {values.image && (
          <div className="relative h-40 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <Image src={values.image} alt={values.imageAlt || 'Ad image preview'} fill unoptimized className="object-cover" />
          </div>
        )}
        <p className="text-xs text-slate-500">Image description is generated automatically from the ad title for accessibility.</p>
        <Field label="Link text" htmlFor={`${id}-cta`} error={errors.callToAction}>
          <Input
            id={`${id}-cta`}
            value={values.callToAction}
            onChange={(event) => set('callToAction', event.target.value)}
            maxLength={40}
            placeholder="Learn more"
            invalid={Boolean(errors.callToAction)}
          />
        </Field>
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(event) => set('isActive', event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-500"
          />
          <span>
            <span className="block text-sm font-medium text-slate-900">Show on landing page</span>
            <span className="block text-xs text-slate-500">Turn off to hide this ad without deleting it.</span>
          </span>
        </label>
        {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
      </form>
    </Modal>
  );
}
