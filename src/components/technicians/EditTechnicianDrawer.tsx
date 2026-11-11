'use client';

import { env } from '@/config/env';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Field, FilterChip, Input, Modal, Select, useToast } from '@/components/ui';
import { SERVICE_CATEGORIES, type ServiceCategory } from '@/config/services';
import { useCreateTechnician, useUpdateTechnician } from '@/hooks/useTechnicians';
import { technicianDocumentsApi } from '@/lib/api';
import { technicianDocumentKeys } from '@/hooks/useTechnicianDocuments';
import {
  WORK_HOURS_LABEL,
  type Technician,
  type WorkHours,
} from '@/types/technician';

// Same option sets as mobile components/work/WorkSettings.tsx
const RADIUS_OPTIONS = [5, 10, 20, 40];
const MAX_JOBS_OPTIONS = [2, 4, 6, 8];
const PHONE_PATTERN = /^\+2507\d{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  name: string;
  phone: string;
  email: string;
  location: string;
  trades: ServiceCategory[];
  yearsExperience: string;
  radiusKm: number;
  maxJobsPerDay: number;
  hours: WorkHours;
  profilePicture: File | null;
  nationalIdDocument: File | null;
  certificateDocument: File | null;
  certificateType: 'TVET_CERTIFICATE' | 'DIPLOMA' | 'ADVANCED_DIPLOMA' | 'DEGREE' | 'SHORT_COURSE' | 'OTHER';
  gender: 'FEMALE' | 'MALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY' | '';
  nationalIdNumber: string;
  paymentMethod: 'MOMO' | 'BANK_TRANSFER' | 'CASH' | 'OTHER' | '';
  paymentNumber: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  name: '',
  phone: '',
  email: '',
  location: '',
  trades: [],
  yearsExperience: '0',
  radiusKm: 10,
  maxJobsPerDay: 4,
  hours: 'days',
  profilePicture: null,
  nationalIdDocument: null,
  certificateDocument: null,
  certificateType: 'TVET_CERTIFICATE',
  gender: '',
  nationalIdNumber: '',
  paymentMethod: '',
  paymentNumber: '',
};

function toForm(t?: Technician): FormState {
  if (!t) return EMPTY_FORM;
  return {
    name: t.name ?? '',
    phone: t.phone ?? '',
    email: t.email ?? '',
    location: t.location ?? '',
    trades: t.trades ?? [],
    yearsExperience: String(t.yearsExperience ?? 0),
    radiusKm: t.workSettings?.radiusKm ?? 10,
    maxJobsPerDay: t.workSettings?.maxJobsPerDay ?? 4,
    hours: t.workSettings?.hours ?? 'days',
    profilePicture: null,
    nationalIdDocument: null,
    certificateDocument: null,
    certificateType: 'TVET_CERTIFICATE',
    gender: t.gender ?? '',
    nationalIdNumber: t.nationalIdNumber ?? '',
    paymentMethod: t.paymentMethod ?? '',
    paymentNumber: t.paymentNumber ?? '',
  };
}

function validate(form: FormState, isNew: boolean): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 2) errors.name = 'Name is required.';
  const phone = form.phone.replace(/\s/g, '');
  if (!PHONE_PATTERN.test(phone)) errors.phone = 'Use a Rwandan mobile number, e.g. +250788123456.';
  if (form.email && !EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (!form.location.trim()) errors.location = 'Location is required.';
  if (form.trades.length === 0) errors.trades = 'Select at least one trade.';
  if (!form.gender) errors.gender = 'Select a gender.';
  if (!/^\d{16}$/.test(form.nationalIdNumber.replace(/\s/g, ''))) {
    errors.nationalIdNumber = 'National ID number must contain exactly 16 digits.';
  }
  if (!form.paymentMethod) errors.paymentMethod = 'Select a payment method.';
  if (!form.paymentNumber.trim()) errors.paymentNumber = 'Payment number is required.';
  if (isNew && !form.nationalIdDocument) errors.nationalIdDocument = 'National ID document is required.';
  if (isNew && !form.certificateDocument) errors.certificateDocument = 'Certificate 1 is required.';
  const years = Number(form.yearsExperience);
  if (!Number.isInteger(years) || years < 0 || years > 60) errors.yearsExperience = 'Enter a whole number from 0 to 60.';
  return errors;
}

/** A titled group of fields. Every group after the first gets a divider above it. */
function FormSection({
  title,
  hint,
  first,
  children,
}: {
  title: string;
  hint?: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={first ? 'space-y-3' : 'space-y-3 border-t border-slate-200 pt-5'}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

interface EditTechnicianDrawerProps {
  /** Leave out to add a new technician. */
  technician?: Technician;
  open: boolean;
  onClose: () => void;
}

export function EditTechnicianDrawer({ technician, open, onClose }: EditTechnicianDrawerProps) {
  const [form, setForm] = useState<FormState>(() => toForm(technician));
  const [errors, setErrors] = useState<Errors>({});
  const update = useUpdateTechnician();
  const create = useCreateTechnician();
  const router = useRouter();
  const queryClient = useQueryClient();
  const saving = update.isPending || create.isPending;
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setForm(toForm(technician));
      setErrors({});
    }
  }, [open, technician]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const toggleTrade = (trade: ServiceCategory) =>
    set('trades', form.trades.includes(trade) ? form.trades.filter((t) => t !== trade) : [...form.trades, trade]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const found = validate(form, !technician);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const input = {
      name: form.name.trim(),
      phone: form.phone.replace(/\s/g, ''),
      email: form.email.trim() || undefined,
      location: form.location.trim(),
      trades: form.trades,
      gender: form.gender as Exclude<FormState['gender'], ''>,
      nationalIdNumber: form.nationalIdNumber.trim(),
      paymentMethod: form.paymentMethod as Exclude<FormState['paymentMethod'], ''>,
      paymentNumber: form.paymentNumber.replace(/\s/g, ''),
      yearsExperience: Number(form.yearsExperience),
      workSettings: { radiusKm: form.radiusKm, maxJobsPerDay: form.maxJobsPerDay, hours: form.hours },
    };
    try {
      if (technician) {
        await update.mutateAsync({ id: technician.id, patch: input });
        if (form.profilePicture) await technicianDocumentsApi.uploadProfilePicture(technician.id, form.profilePicture);
        if (form.nationalIdDocument) {
          await technicianDocumentsApi.uploadDocument(technician.id, form.nationalIdDocument, 'NATIONAL_ID', 'National ID');
        }
        if (form.certificateDocument) {
          await technicianDocumentsApi.uploadDocument(technician.id, form.certificateDocument, 'CERTIFICATE', 'Certificate 1', {
            certificateType: form.certificateType,
            customCategoryName: form.trades[0],
          });
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: technicianDocumentKeys.list(technician.id) }),
          queryClient.invalidateQueries({ queryKey: technicianDocumentKeys.checklist(technician.id) }),
        ]);
        toast('Profile updated');
        onClose();
      } else {
        const created = await create.mutateAsync(input);
        if (form.profilePicture) await technicianDocumentsApi.uploadProfilePicture(created.id, form.profilePicture);
        if (form.nationalIdDocument) {
          await technicianDocumentsApi.uploadDocument(created.id, form.nationalIdDocument, 'NATIONAL_ID', 'National ID');
        }
        if (form.certificateDocument) {
          await technicianDocumentsApi.uploadDocument(created.id, form.certificateDocument, 'CERTIFICATE', 'Certificate 1', {
            certificateType: form.certificateType,
            customCategoryName: form.trades[0],
          });
        }
        toast(`${created.name} added`);
        onClose();
        router.push(`/admin/technicians/${created.id}`);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save changes', 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="dialog"
      title={technician ? 'Edit profile' : 'Add technician'}
      description={
        technician
          ? `Update ${technician.name}'s details.`
          : 'They will need to submit documents and be verified before receiving jobs.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => submit()} loading={saving}>
            {technician ? 'Save changes' : 'Add technician'}
          </Button>
        </>
      }
    >
      <form className="space-y-3 pb-1" onSubmit={submit} noValidate>
        {/* 1. Who they are and how to reach them */}
        <FormSection title="Contact details" first>
          <Field label="Full name" htmlFor="edit-name" error={errors.name}>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              invalid={!!errors.name}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Phone" htmlFor="edit-phone" error={errors.phone}>
              <Input
                id="edit-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                invalid={!!errors.phone}
                placeholder="+250788123456"
              />
            </Field>
            <Field label="Email (optional)" htmlFor="edit-email" error={errors.email}>
              <Input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                invalid={!!errors.email}
              />
            </Field>
          </div>

          <Field label="Location" htmlFor="edit-location" error={errors.location}>
            <Input
              id="edit-location"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              invalid={!!errors.location}
              placeholder="e.g. Kimironko, Gasabo"
            />
          </Field>
        </FormSection>

        {/* 2. What they do */}
        <FormSection title="Jobs they can do" hint="Select every service this technician can perform.">
          <fieldset className="space-y-1.5">
            <legend className="sr-only">Jobs they can do</legend>
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map((trade) => (
                <FilterChip
                  key={trade}
                  label={trade}
                  selected={form.trades.includes(trade)}
                  onClick={() => toggleTrade(trade)}
                />
              ))}
            </div>
            {errors.trades && (
              <p className="text-xs font-medium text-red-600" role="alert">
                {errors.trades}
              </p>
            )}
          </fieldset>
        </FormSection>

        <FormSection title="Identity and payment details" hint="These fields are required by the technician profile API.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Gender" htmlFor="edit-gender" error={errors.gender}>
              <Select id="edit-gender" value={form.gender} onChange={(e) => set('gender', e.target.value as FormState['gender'])}>
                <option value="">Select gender</option>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
              </Select>
            </Field>
            <Field label="National ID number" htmlFor="edit-national-id-number" error={errors.nationalIdNumber}>
              <Input id="edit-national-id-number" value={form.nationalIdNumber} onChange={(e) => set('nationalIdNumber', e.target.value.replace(/\D/g, '').slice(0, 16))} invalid={!!errors.nationalIdNumber} inputMode="numeric" maxLength={16} placeholder="16-digit National ID" />
            </Field>
            <Field label="Payment method" htmlFor="edit-payment-method" error={errors.paymentMethod}>
              <Select id="edit-payment-method" value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value as FormState['paymentMethod'])}>
                <option value="">Select payment method</option>
                <option value="MOMO">Mobile Money</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </Select>
            </Field>
            <Field label="Payment number" htmlFor="edit-payment-number" error={errors.paymentNumber}>
              <Input id="edit-payment-number" value={form.paymentNumber} onChange={(e) => set('paymentNumber', e.target.value)} invalid={!!errors.paymentNumber} placeholder="+250788123456" />
            </Field>
          </div>
        </FormSection>

        {/* 3. How and when they work */}
        <FormSection title="Experience and availability">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Years of experience" htmlFor="edit-years" error={errors.yearsExperience}>
              <Input
                id="edit-years"
                type="number"
                min={0}
                max={60}
                value={form.yearsExperience}
                onChange={(e) => set('yearsExperience', e.target.value)}
                invalid={!!errors.yearsExperience}
              />
            </Field>
            <Field label="Working hours" htmlFor="edit-hours">
              <Select disabled={!env.useMocks} id="edit-hours" value={form.hours} onChange={(e) => set('hours', e.target.value as WorkHours)}>
                {(Object.keys(WORK_HOURS_LABEL) as WorkHours[]).map((h) => (
                  <option key={h} value={h}>
                    {WORK_HOURS_LABEL[h]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Service radius" htmlFor="edit-radius">
              <Select disabled={!env.useMocks} id="edit-radius" value={form.radiusKm} onChange={(e) => set('radiusKm', Number(e.target.value))}>
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Max jobs / day" htmlFor="edit-max-jobs">
              <Select
                disabled={!env.useMocks}
                id="edit-max-jobs"
                value={form.maxJobsPerDay}
                onChange={(e) => set('maxJobsPerDay', Number(e.target.value))}
              >
                {MAX_JOBS_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </FormSection>

        {/* Documents are uploaded after the technician profile has been saved. */}
        <FormSection title="Verification documents" hint="These files upload last, after the technician profile is created or updated.">
          <div className="space-y-3">
            <Field label="Profile picture" htmlFor="technician-profile-picture">
              <Input
                id="technician-profile-picture"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => set('profilePicture', event.target.files?.[0] ?? null)}
              />
            </Field>
            <Field label="National ID document" htmlFor="technician-national-id" error={errors.nationalIdDocument}>
              <Input
                id="technician-national-id"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(event) => set('nationalIdDocument', event.target.files?.[0] ?? null)}
              />
            </Field>
            <Field label="Certificate type" htmlFor="technician-certificate-type" hint="An accepted TVET certificate is required for technician approval.">
              <Select id="technician-certificate-type" value={form.certificateType} onChange={(event) => set('certificateType', event.target.value as FormState['certificateType'])}>
                <option value="TVET_CERTIFICATE">TVET certificate</option>
                <option value="DIPLOMA">Diploma</option>
                <option value="ADVANCED_DIPLOMA">Advanced diploma</option>
                <option value="DEGREE">Degree</option>
                <option value="SHORT_COURSE">Short course certificate</option>
                <option value="OTHER">Other certificate</option>
              </Select>
            </Field>
            <Field label="Certificate 1" htmlFor="technician-certificate" error={errors.certificateDocument}>
              <Input
                id="technician-certificate"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(event) => set('certificateDocument', event.target.files?.[0] ?? null)}
              />
            </Field>
          </div>
        </FormSection>

        {/* Lets Enter submit the form */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
