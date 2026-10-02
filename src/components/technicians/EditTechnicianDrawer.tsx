'use client';

import React, { useEffect, useState } from 'react';
import { Button, Field, FilterChip, Input, Modal, Select, useToast } from '@/components/ui';
import { SERVICE_CATEGORIES, type ServiceCategory } from '@/config/services';
import { useUpdateTechnician } from '@/hooks/useTechnicians';
import {
  WORK_HOURS_LABEL,
  type Technician,
  type TechnicianProfilePatch,
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
}

type Errors = Partial<Record<keyof FormState, string>>;

function toForm(t: Technician): FormState {
  return {
    name: t.name,
    phone: t.phone,
    email: t.email ?? '',
    location: t.location,
    trades: t.trades,
    yearsExperience: String(t.yearsExperience),
    radiusKm: t.workSettings.radiusKm,
    maxJobsPerDay: t.workSettings.maxJobsPerDay,
    hours: t.workSettings.hours,
  };
}

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 2) errors.name = 'Name is required.';
  const phone = form.phone.replace(/\s/g, '');
  if (!PHONE_PATTERN.test(phone)) errors.phone = 'Use a Rwandan mobile number, e.g. +250788123456.';
  if (form.email && !EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (!form.location.trim()) errors.location = 'Location is required.';
  if (form.trades.length === 0) errors.trades = 'Select at least one trade.';
  const years = Number(form.yearsExperience);
  if (!Number.isInteger(years) || years < 0 || years > 60) errors.yearsExperience = 'Enter a whole number from 0 to 60.';
  return errors;
}

interface EditTechnicianDrawerProps {
  technician: Technician;
  open: boolean;
  onClose: () => void;
}

export function EditTechnicianDrawer({ technician, open, onClose }: EditTechnicianDrawerProps) {
  const [form, setForm] = useState<FormState>(() => toForm(technician));
  const [errors, setErrors] = useState<Errors>({});
  const update = useUpdateTechnician();
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
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const patch: TechnicianProfilePatch = {
      name: form.name.trim(),
      phone: form.phone.replace(/\s/g, ''),
      email: form.email.trim() || undefined,
      location: form.location.trim(),
      trades: form.trades,
      yearsExperience: Number(form.yearsExperience),
      workSettings: { radiusKm: form.radiusKm, maxJobsPerDay: form.maxJobsPerDay, hours: form.hours },
    };
    try {
      await update.mutateAsync({ id: technician.id, patch });
      toast('Profile updated');
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save changes', 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="drawer"
      title="Edit profile"
      description={`Update ${technician.name}'s details.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={() => submit()} loading={update.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      <form className="space-y-4 pb-2" onSubmit={submit} noValidate>
        <Field label="Full name" htmlFor="edit-name" error={errors.name}>
          <Input id="edit-name" value={form.name} onChange={(e) => set('name', e.target.value)} invalid={!!errors.name} />
        </Field>
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
        <Field label="Location" htmlFor="edit-location" error={errors.location}>
          <Input
            id="edit-location"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            invalid={!!errors.location}
            placeholder="e.g. Kimironko, Gasabo"
          />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700">Trades</legend>
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

        <div className="grid grid-cols-2 gap-3">
          <Field label="Service radius" htmlFor="edit-radius">
            <Select id="edit-radius" value={form.radiusKm} onChange={(e) => set('radiusKm', Number(e.target.value))}>
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r} km
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Max jobs / day" htmlFor="edit-max-jobs">
            <Select
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
        <Field label="Working hours" htmlFor="edit-hours">
          <Select id="edit-hours" value={form.hours} onChange={(e) => set('hours', e.target.value as WorkHours)}>
            {(Object.keys(WORK_HOURS_LABEL) as WorkHours[]).map((h) => (
              <option key={h} value={h}>
                {WORK_HOURS_LABEL[h]}
              </option>
            ))}
          </Select>
        </Field>
        {/* Lets Enter submit the form */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
