'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Field, FilterChip, Input, Modal, Select, Textarea, useToast } from '@/components/ui';
import { companyKeys, useCompanies } from '@/hooks/useCompanies';
import { technicianDocumentKeys } from '@/hooks/useTechnicianDocuments';
import { useServices } from '@/hooks/useServices';
import { useCreateTechnician, useUpdateTechnician } from '@/hooks/useTechnicians';
import { companiesApi, technicianDocumentsApi } from '@/lib/api';
import type { AdminCompany } from '@/lib/api/endpoints/companies';
import {
  type BusinessType,
  type CompanyDetails,
  type Gender,
  type PaymentMethod,
  type Technician,
  type TechnicianInput,
} from '@/types/technician';

const PHONE_PATTERN = /^\+2507[2389]\d{7}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const DOCUMENT_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const CERTIFICATE_TYPES = [
  { value: 'TVET_CERTIFICATE', label: 'TVET certificate' },
  { value: 'DIPLOMA', label: 'Diploma' },
  { value: 'ADVANCED_DIPLOMA', label: 'Advanced diploma' },
  { value: 'DEGREE', label: 'Degree' },
  { value: 'SHORT_COURSE', label: 'Short course certificate' },
  { value: 'OTHER', label: 'Other certificate' },
] as const;

type CertificateType = (typeof CERTIFICATE_TYPES)[number]['value'];

type ServiceRow = {
  key: string;
  categoryId: string | null;
  customName: string;
  yearsOfExperience: string;
};

type CertificateRow = {
  key: string;
  file: File | null;
  certificateType: CertificateType;
  categoryId: string | null;
  customName: string;
};

interface FormState {
  name: string;
  phone: string;
  email: string;
  location: string;
  latitude: string;
  longitude: string;
  businessType: BusinessType;
  company: CompanyDetails;
  services: ServiceRow[];
  gender: Gender;
  nationalIdNumber: string;
  paymentMethod: PaymentMethod;
  paymentNumber: string;
  profilePicture: File | null;
  nationalIdDocument: File | null;
  certificates: CertificateRow[];
}

type Errors = Partial<Record<keyof FormState, string>>;

let rowCounter = 0;
function nextKey() {
  rowCounter += 1;
  return `row-${rowCounter}`;
}

function blankService(): ServiceRow {
  return { key: nextKey(), categoryId: null, customName: '', yearsOfExperience: '1' };
}

function blankCertificate(categoryId: string | null = null, customName = ''): CertificateRow {
  return { key: nextKey(), file: null, certificateType: 'TVET_CERTIFICATE', categoryId, customName };
}

function emptyCompany(): CompanyDetails {
  return { name: '', location: '', email: '', phoneNumber: '', description: '' };
}

function emptyForm(): FormState {
  return {
    name: '',
    phone: '',
    email: '',
    location: '',
    latitude: '',
    longitude: '',
    businessType: 'INDIVIDUAL',
    company: emptyCompany(),
    services: [blankService()],
    gender: 'PREFER_NOT_TO_SAY',
    nationalIdNumber: '',
    paymentMethod: 'MOMO',
    paymentNumber: '',
    profilePicture: null,
    nationalIdDocument: null,
    certificates: [],
  };
}

function toForm(t?: Technician, company?: AdminCompany): FormState {
  if (!t) return emptyForm();
  const services = t.serviceExperiences?.length
    ? t.serviceExperiences.map((experience) => ({
        key: nextKey(),
        categoryId: experience.categoryId ?? null,
        customName: experience.customName ?? '',
        yearsOfExperience: String(experience.yearsOfExperience || 1),
      }))
    : t.trades.map((trade) => ({ ...blankService(), customName: trade }));

  return {
    ...emptyForm(),
    name: t.name ?? '',
    phone: t.phone ?? '',
    email: t.email ?? '',
    location: t.location === '—' ? '' : t.location ?? '',
    latitude: t.baseLatitude != null ? String(t.baseLatitude) : '',
    longitude: t.baseLongitude != null ? String(t.baseLongitude) : '',
    businessType: company || t.businessType === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL',
    company: company
      ? {
          name: company.name,
          location: company.location,
          email: company.email,
          phoneNumber: company.phoneNumber,
          description: company.description ?? '',
        }
      : emptyCompany(),
    services: services.length ? services : [blankService()],
    gender: t.gender ?? 'PREFER_NOT_TO_SAY',
    nationalIdNumber: t.nationalIdNumber ?? '',
    paymentMethod: t.paymentMethod ?? 'MOMO',
    paymentNumber: t.paymentNumber ?? t.phone ?? '',
  };
}

function normalizePhone(value: string): string {
  const compact = value.replace(/[^\d+]/g, '');
  if (compact.startsWith('+')) return compact;
  const digits = compact.replace(/\D/g, '');
  if (digits.startsWith('250')) return `+${digits}`;
  if (digits.startsWith('0')) return `+250${digits.slice(1)}`;
  if (/^7\d{8}$/.test(digits)) return `+250${digits}`;
  return digits ? `+${digits}` : '';
}

function inferredMime(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'pdf') return 'application/pdf';
  return '';
}

function fileError(file: File | null, allowPdf: boolean): string | undefined {
  if (!file) return undefined;
  if (file.size > MAX_FILE_BYTES) return 'File must be 5 MB or smaller.';
  const mime = inferredMime(file);
  const allowed = allowPdf ? [...IMAGE_MIME_TYPES, 'application/pdf'] : IMAGE_MIME_TYPES;
  if (!allowed.includes(mime)) return allowPdf ? 'Choose a photo or PDF file.' : 'Choose a photo file.';
  return undefined;
}

function firstCompanyError(company: CompanyDetails): string | undefined {
  const name = company.name.trim();
  const location = company.location.trim();
  const email = company.email.trim();
  if (name.length < 2 || name.length > 160) return 'Enter a company name (2–160 characters).';
  if (location.length < 2 || location.length > 255) return 'Enter where the company is based (2–255 characters).';
  if (!EMAIL_PATTERN.test(email) || email.length > 254) return 'Enter a valid company email address.';
  if (!PHONE_PATTERN.test(normalizePhone(company.phoneNumber))) {
    return 'Enter a company phone number such as +250788123456.';
  }
  if (company.description?.trim().length && company.description.trim().length > 2000) {
    return 'Use at most 2000 characters for the description.';
  }
  return undefined;
}

function companyPayload(company: CompanyDetails): CompanyDetails {
  const description = company.description?.trim();
  return {
    name: company.name.trim(),
    location: company.location.trim(),
    email: company.email.trim().toLowerCase(),
    phoneNumber: normalizePhone(company.phoneNumber),
    ...(description ? { description } : {}),
  };
}

function validate(form: FormState, isNew: boolean): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 2) errors.name = 'Name is required.';
  else if (form.name.trim().length > 120) errors.name = 'Use at most 120 characters.';
  if (!PHONE_PATTERN.test(normalizePhone(form.phone))) {
    errors.phone = 'Use a Rwandan mobile number, e.g. +250788123456.';
  }
  if (form.email.trim() && (!EMAIL_PATTERN.test(form.email.trim()) || form.email.trim().length > 254)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!form.location.trim()) errors.location = 'Location is required.';
  else if (form.location.trim().length > 255) errors.location = 'Use at most 255 characters.';
  else if (form.location.trim().split(',')[0].trim().length > 120) {
    errors.location = 'The public location label must be at most 120 characters.';
  }

  const hasLatitude = form.latitude.trim() !== '';
  const hasLongitude = form.longitude.trim() !== '';
  if (hasLatitude !== hasLongitude) {
    errors.location = 'Enter both base latitude and longitude, or leave both blank.';
  } else if (hasLatitude) {
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      errors.location = 'Enter valid base coordinates.';
    }
  }

  if (form.businessType === 'COMPANY') {
    const companyError = firstCompanyError(form.company);
    if (companyError) errors.company = companyError;
  }

  if (form.services.length === 0) {
    errors.services = 'Add at least one trade.';
  } else {
    const seen = new Set<string>();
    for (const service of form.services) {
      const customName = service.customName.trim();
      if (!service.categoryId && (customName.length < 2 || customName.length > 80)) {
        errors.services = 'Choose a trade or name a custom trade (2–80 characters).';
        break;
      }
      if (service.categoryId && !UUID.test(service.categoryId)) {
        errors.services = 'Choose a trade from the catalogue.';
        break;
      }
      const key = service.categoryId ? `cat:${service.categoryId}` : `own:${customName.toLowerCase()}`;
      if (seen.has(key)) {
        errors.services = 'Each trade can only be listed once.';
        break;
      }
      seen.add(key);
      const years = Number(service.yearsOfExperience);
      if (!Number.isInteger(years) || years < 1 || years > 40) {
        errors.services = 'Experience must be a whole number from 1 to 40 years.';
        break;
      }
    }
  }

  const nationalId = form.nationalIdNumber.trim();
  if (!nationalId) {
    if (isNew) errors.nationalIdNumber = 'National ID number must contain exactly 16 digits.';
  } else if (!/^\d{16}$/.test(nationalId) && !/^\*{4}\d{4}$/.test(nationalId)) {
    errors.nationalIdNumber = 'National ID number must contain exactly 16 digits.';
  }
  if (!form.paymentMethod) errors.paymentMethod = 'Select a payment method.';
  if (!PHONE_PATTERN.test(normalizePhone(form.paymentNumber.trim() || form.phone))) {
    errors.paymentNumber = 'Use a Rwandan mobile number, e.g. +250788123456.';
  }

  const pictureError = fileError(form.profilePicture, false);
  if (pictureError) errors.profilePicture = pictureError;
  if (isNew && !form.nationalIdDocument) errors.nationalIdDocument = 'National ID document is required.';
  const idError = fileError(form.nationalIdDocument, true);
  if (idError) errors.nationalIdDocument = idError;
  for (const certificate of form.certificates) {
    const error = certificate.file ? fileError(certificate.file, true) : undefined;
    if (error) {
      errors.certificates = error;
      break;
    }
    if (certificate.file && !certificate.categoryId && certificate.customName.trim().length < 2) {
      errors.certificates = 'Name the trade each certificate is for.';
      break;
    }
  }
  return errors;
}

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
  const [busy, setBusy] = useState(false);
  const savedIdRef = useRef<string | null>(null);
  const update = useUpdateTechnician();
  const create = useCreateTechnician();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const servicesQuery = useServices(open);
  const companyQuery = useCompanies(open && Boolean(technician));
  const serviceOptions = useMemo(
    () => (servicesQuery.data ?? []).filter((service) => service.isActive),
    [servicesQuery.data],
  );
  const saving = busy || update.isPending || create.isPending;

  useEffect(() => {
    if (!open) return;
    savedIdRef.current = technician?.id ?? null;
    if (technician && companyQuery.isLoading) return;
    const existingCompany = companyQuery.data?.find((item) => item.technicianId === technician?.id);
    setForm(toForm(technician, existingCompany));
    setErrors({});
  }, [open, technician, companyQuery.isLoading, companyQuery.data]);

  useEffect(() => {
    if (!serviceOptions.length) return;
    setForm((current) => {
      let changed = false;
      const services = current.services.map((service) => {
        if (service.categoryId) return service;
        const name = service.customName.trim().toLowerCase();
        const match = serviceOptions.find((option) => option.name.trim().toLowerCase() === name);
        if (!match) return service;
        changed = true;
        return { ...service, categoryId: match.id, customName: '' };
      });
      return changed ? { ...current, services } : current;
    });
  }, [serviceOptions]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setCompanyField = (key: keyof CompanyDetails, value: string) => {
    setForm((current) => ({ ...current, company: { ...current.company, [key]: value } }));
    if (errors.company) setErrors((current) => ({ ...current, company: undefined }));
  };

  const setServiceField = (key: string, patch: Partial<ServiceRow>) => {
    setForm((current) => ({
      ...current,
      services: current.services.map((service) => (service.key === key ? { ...service, ...patch } : service)),
    }));
    if (errors.services) setErrors((current) => ({ ...current, services: undefined }));
  };

  const addService = () => {
    if (form.services.length >= 10) return;
    set('services', [...form.services, blankService()]);
  };

  const removeService = (key: string) => {
    if (form.services.length <= 1) return;
    set('services', form.services.filter((service) => service.key !== key));
  };

  const setCertificateField = (key: string, patch: Partial<CertificateRow>) => {
    setForm((current) => ({
      ...current,
      certificates: current.certificates.map((certificate) =>
        certificate.key === key ? { ...certificate, ...patch } : certificate,
      ),
    }));
    if (errors.certificates) setErrors((current) => ({ ...current, certificates: undefined }));
  };

  const addCertificate = () => {
    if (form.certificates.length >= 5) return;
    const firstService = form.services[0];
    const certificate = firstService
      ? blankCertificate(firstService.categoryId, firstService.categoryId ? '' : firstService.customName)
      : blankCertificate();
    set('certificates', [...form.certificates, certificate]);
  };

  const buildInput = (): TechnicianInput => ({
    name: form.name.trim(),
    phone: normalizePhone(form.phone),
    email: form.email.trim() || undefined,
    location: form.location.trim(),
    ...(form.latitude.trim() ? { baseLatitude: Number(form.latitude) } : {}),
    ...(form.longitude.trim() ? { baseLongitude: Number(form.longitude) } : {}),
    serviceExperiences: form.services.map((service) => ({
      categoryId: service.categoryId,
      customName: service.categoryId ? undefined : service.customName.trim(),
      yearsOfExperience: Number(service.yearsOfExperience) || 1,
    })),
    gender: form.gender,
    nationalIdNumber: form.nationalIdNumber.trim() || undefined,
    paymentMethod: form.paymentMethod,
    paymentNumber: normalizePhone(form.paymentNumber.trim() || form.phone),
  });

  const uploadDocuments = async (technicianId: string) => {
    const uploads: Promise<unknown>[] = [];
    if (form.profilePicture) {
      uploads.push(technicianDocumentsApi.uploadProfilePicture(technicianId, form.profilePicture));
    }
    if (form.nationalIdDocument) {
      uploads.push(
        technicianDocumentsApi.uploadDocument(technicianId, form.nationalIdDocument, 'NATIONAL_ID', 'National ID card'),
      );
    }
    form.certificates.forEach((certificate, index) => {
      if (!certificate.file) return;
      uploads.push(
        technicianDocumentsApi.uploadDocument(technicianId, certificate.file, 'CERTIFICATE', `Certificate ${index + 1}`, {
          certificateType: certificate.certificateType,
          categoryId: certificate.categoryId ?? undefined,
          customCategoryName: certificate.categoryId ? undefined : certificate.customName.trim(),
        }),
      );
    });
    await Promise.all(uploads);
  };

  const syncCompany = async (technicianId: string) => {
    if (form.businessType === 'INDIVIDUAL') {
      const existing = companyQuery.data?.find((item) => item.technicianId === technicianId);
      if (existing) await companiesApi.remove(existing.id);
      return;
    }
    const details = companyPayload(form.company);
    const existing = companyQuery.data?.find((item) => item.technicianId === technicianId);
    if (existing) await companiesApi.update(existing.id, details);
    else await companiesApi.create(technicianId, details);
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const found = validate(form, !technician);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      const input = buildInput();
      let technicianId = savedIdRef.current;
      if (!technicianId) {
        const created = await create.mutateAsync(input);
        technicianId = created.id;
        savedIdRef.current = created.id;
      } else {
        await update.mutateAsync({ id: technicianId, patch: input });
      }
      await syncCompany(technicianId);
      await uploadDocuments(technicianId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: technicianDocumentKeys.list(technicianId) }),
        queryClient.invalidateQueries({ queryKey: technicianDocumentKeys.checklist(technicianId) }),
        queryClient.invalidateQueries({ queryKey: companyKeys.all }),
      ]);
      toast(technician ? 'Profile updated' : 'Technician added');
      onClose();
      if (!technician) router.push(`/admin/technicians/${technicianId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save changes', 'error');
    } finally {
      setBusy(false);
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
          : 'Create a pending technician profile with the same details used in the mobile application.'
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
        <FormSection title="Contact details" first>
          <Field label="Full name" htmlFor="edit-name" error={errors.name}>
            <Input id="edit-name" value={form.name} onChange={(event) => set('name', event.target.value)} invalid={!!errors.name} maxLength={120} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Phone" htmlFor="edit-phone" error={errors.phone}>
              <Input id="edit-phone" type="tel" value={form.phone} onChange={(event) => set('phone', event.target.value)} invalid={!!errors.phone} placeholder="+250788123456" />
            </Field>
            <Field label="Email (optional)" htmlFor="edit-email" error={errors.email}>
              <Input id="edit-email" type="email" value={form.email} onChange={(event) => set('email', event.target.value)} invalid={!!errors.email} maxLength={254} />
            </Field>
          </div>
          <Field label="Base address / city" htmlFor="edit-location" error={errors.location} hint="The first part is shown publicly as the technician's location.">
            <Input id="edit-location" value={form.location} onChange={(event) => set('location', event.target.value)} invalid={!!errors.location} placeholder="e.g. Kimironko, Gasabo" maxLength={255} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Base latitude (optional)" htmlFor="edit-latitude">
              <Input id="edit-latitude" value={form.latitude} onChange={(event) => set('latitude', event.target.value)} placeholder="-1.9441" />
            </Field>
            <Field label="Base longitude (optional)" htmlFor="edit-longitude">
              <Input id="edit-longitude" value={form.longitude} onChange={(event) => set('longitude', event.target.value)} placeholder="30.0619" />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Business type" hint="A company is reviewed along with the technician's application.">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Business type">
            <FilterChip label="On my own" selected={form.businessType === 'INDIVIDUAL'} onClick={() => set('businessType', 'INDIVIDUAL')} />
            <FilterChip label="As a company" selected={form.businessType === 'COMPANY'} onClick={() => set('businessType', 'COMPANY')} />
          </div>
          {form.businessType === 'COMPANY' && (
            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              {errors.company && <p className="text-xs font-medium text-red-600" role="alert">{errors.company}</p>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Company name" htmlFor="company-name">
                  <Input id="company-name" value={form.company.name} onChange={(event) => setCompanyField('name', event.target.value)} maxLength={160} />
                </Field>
                <Field label="Where the company is based" htmlFor="company-location">
                  <Input id="company-location" value={form.company.location} onChange={(event) => setCompanyField('location', event.target.value)} maxLength={255} />
                </Field>
                <Field label="Company email" htmlFor="company-email">
                  <Input id="company-email" type="email" value={form.company.email} onChange={(event) => setCompanyField('email', event.target.value)} maxLength={254} />
                </Field>
                <Field label="Company phone" htmlFor="company-phone">
                  <Input id="company-phone" type="tel" value={form.company.phoneNumber} onChange={(event) => setCompanyField('phoneNumber', event.target.value)} placeholder="+250788123456" />
                </Field>
              </div>
              <Field label="What the company does (optional)" htmlFor="company-description">
                <Textarea id="company-description" value={form.company.description ?? ''} onChange={(event) => setCompanyField('description', event.target.value)} maxLength={2000} />
              </Field>
            </div>
          )}
        </FormSection>

        <FormSection title="Trades & skills" hint="Select catalog services or add your own, with years of experience for each.">
          {servicesQuery.isLoading && <p className="text-xs text-slate-500">Loading catalog services…</p>}
          {servicesQuery.isError && <p className="text-xs text-red-600">Could not load catalog services. You can still add custom trades.</p>}
          <div className="space-y-3">
            {form.services.map((service, index) => (
              <div key={service.key} className="space-y-3 rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trade #{index + 1}</p>
                  {form.services.length > 1 && (
                    <button type="button" onClick={() => removeService(service.key)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove trade ${index + 1}`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Service" htmlFor={`service-${service.key}`}>
                    <Select
                      id={`service-${service.key}`}
                      value={service.categoryId ?? 'custom'}
                      onChange={(event) =>
                        setServiceField(service.key, {
                          categoryId: event.target.value === 'custom' ? null : event.target.value,
                          customName: '',
                        })
                      }
                    >
                      <option value="custom">Others (custom trade)</option>
                      {serviceOptions.map((option) => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Years of experience" htmlFor={`years-${service.key}`}>
                    <Input
                      id={`years-${service.key}`}
                      type="number"
                      min={1}
                      max={40}
                      value={service.yearsOfExperience}
                      onChange={(event) => setServiceField(service.key, { yearsOfExperience: event.target.value })}
                    />
                  </Field>
                </div>
                {!service.categoryId && (
                  <Field label="Custom trade name" htmlFor={`custom-${service.key}`}>
                    <Input
                      id={`custom-${service.key}`}
                      value={service.customName}
                      onChange={(event) => setServiceField(service.key, { customName: event.target.value })}
                      placeholder="e.g. Solar panel installation"
                      maxLength={80}
                    />
                  </Field>
                )}
              </div>
            ))}
          </div>
          {errors.services && <p className="text-xs font-medium text-red-600" role="alert">{errors.services}</p>}
          {form.services.length < 10 && (
            <Button type="button" variant="secondary" size="sm" onClick={addService}>
              <Plus className="h-4 w-4" aria-hidden />
              Add trade
            </Button>
          )}
        </FormSection>

        <FormSection title="Identity and payment details">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Gender" htmlFor="edit-gender">
              <Select id="edit-gender" value={form.gender} onChange={(event) => set('gender', event.target.value as Gender)}>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="NON_BINARY">Non-binary</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </Select>
            </Field>
            <Field label="National ID number" htmlFor="edit-national-id-number" error={errors.nationalIdNumber}>
              <Input id="edit-national-id-number" value={form.nationalIdNumber} onChange={(event) => set('nationalIdNumber', event.target.value.replace(/\D/g, '').slice(0, 16))} invalid={!!errors.nationalIdNumber} inputMode="numeric" maxLength={16} placeholder="16-digit National ID" />
            </Field>
            <Field label="Payment method" htmlFor="edit-payment-method" error={errors.paymentMethod}>
              <Select id="edit-payment-method" value={form.paymentMethod} onChange={(event) => set('paymentMethod', event.target.value as PaymentMethod)}>
                <option value="MOMO">Mobile Money</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </Select>
            </Field>
            <Field label="Payout phone / account" htmlFor="edit-payment-number" error={errors.paymentNumber}>
              <Input id="edit-payment-number" value={form.paymentNumber} onChange={(event) => set('paymentNumber', event.target.value)} invalid={!!errors.paymentNumber} placeholder="+250788123456" />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Verification documents" hint="National ID is required for a new technician; certificates are optional.">
          <div className="space-y-3">
            <Field label="Profile photo (optional)" htmlFor="technician-profile-picture" error={errors.profilePicture} hint="JPG, PNG or WebP, up to 5 MB.">
              <Input id="technician-profile-picture" type="file" accept={IMAGE_ACCEPT} onChange={(event) => set('profilePicture', event.target.files?.[0] ?? null)} />
            </Field>
            <Field label="National ID card" htmlFor="technician-national-id" error={errors.nationalIdDocument} hint="Photo or PDF, up to 5 MB.">
              <Input id="technician-national-id" type="file" accept={DOCUMENT_ACCEPT} onChange={(event) => set('nationalIdDocument', event.target.files?.[0] ?? null)} />
            </Field>
            {form.certificates.map((certificate, index) => (
              <div key={certificate.key} className="space-y-3 rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Certificate #{index + 1}</p>
                  <button type="button" onClick={() => set('certificates', form.certificates.filter((item) => item.key !== certificate.key))} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove certificate ${index + 1}`}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Certificate file" htmlFor={`certificate-file-${certificate.key}`}>
                    <Input
                      id={`certificate-file-${certificate.key}`}
                      type="file"
                      accept={DOCUMENT_ACCEPT}
                      onChange={(event) => setCertificateField(certificate.key, { file: event.target.files?.[0] ?? null })}
                    />
                  </Field>
                  <Field label="Certificate type" htmlFor={`certificate-type-${certificate.key}`}>
                    <Select
                      id={`certificate-type-${certificate.key}`}
                      value={certificate.certificateType}
                      onChange={(event) => setCertificateField(certificate.key, { certificateType: event.target.value as CertificateType })}
                    >
                      {CERTIFICATE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Related service" htmlFor={`certificate-service-${certificate.key}`}>
                    <Select
                      id={`certificate-service-${certificate.key}`}
                      value={certificate.categoryId ?? 'custom'}
                      onChange={(event) =>
                        setCertificateField(certificate.key, {
                          categoryId: event.target.value === 'custom' ? null : event.target.value,
                          customName: '',
                        })
                      }
                    >
                      <option value="custom">Others (custom trade)</option>
                      {serviceOptions.map((option) => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </Select>
                  </Field>
                  {!certificate.categoryId && (
                    <Field label="Custom trade name" htmlFor={`certificate-custom-${certificate.key}`}>
                      <Input
                        id={`certificate-custom-${certificate.key}`}
                        value={certificate.customName}
                        onChange={(event) => setCertificateField(certificate.key, { customName: event.target.value })}
                        placeholder="e.g. Solar panel installation"
                        maxLength={80}
                      />
                    </Field>
                  )}
                </div>
              </div>
            ))}
          </div>
          {errors.certificates && <p className="text-xs font-medium text-red-600" role="alert">{errors.certificates}</p>}
          {form.certificates.length < 5 && (
            <Button type="button" variant="secondary" size="sm" onClick={addCertificate}>
              <Plus className="h-4 w-4" aria-hidden />
              Add certificate
            </Button>
          )}
        </FormSection>

        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
