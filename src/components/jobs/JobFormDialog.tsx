'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, Modal, Select, Textarea, useToast } from '@/components/ui';
import { useCreateJob, useUpdateJob } from '@/hooks/useJobs';
import { useServices } from '@/hooks/useServices';
import { useTechnicians } from '@/hooks/useTechnicians';
import { getServiceGroup, SERVICE_GROUPS, type ServiceGroup } from '@/config/services';
import { formatMoney } from '@/lib/jobs';
import { URGENCIES, type Job, type JobInput, type Urgency } from '@/types/job';

const EMPTY: JobInput = { customerId: '', partyType: 'technician', service: '', problem: '', urgency: 'Today', location: '' };

type Errors = Partial<Record<keyof JobInput, string>>;

function validate(input: JobInput, isNew: boolean): Errors {
  const errors: Errors = {};
  if (isNew && !input.customerId) {
    errors.customerId = 'Choose a technician.';
  }
  if (!input.service) errors.service = 'Choose a service.';
  if (input.problem.trim().length < 5) errors.problem = 'Describe the problem in a few words.';
  if (input.location.trim().length < 3) errors.location = 'Enter where the technician should go.';
  return errors;
}

/** Create a job for a technician, or edit `job` before its visit fee is paid. */
export function JobFormDialog({ open, onClose, job }: { open: boolean; onClose: () => void; job?: Job }) {
  const id = useId();
  const router = useRouter();
  const toast = useToast();
  const create = useCreateJob();
  const update = useUpdateJob();
  const technicians = useTechnicians({ status: 'active', sort: 'name', pageSize: 100 });
  const services = useServices();
  const [input, setInput] = useState<JobInput>(EMPTY);
  const [serviceCategory, setServiceCategory] = useState<ServiceGroup | ''>('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setInput(
      job
        ? {
            customerId: job.customer.id,
            partyType: 'customer',
            service: job.service,
            problem: job.problem,
            urgency: job.urgency,
            location: job.location,
          }
        : EMPTY,
    );
    setServiceCategory('');
  }, [open, job]);

  useEffect(() => {
    if (!open || !job || !services.data) return;
    const jobService = services.data.find((service) => service.name === job.service);
    if (jobService) setServiceCategory(jobService.category ?? getServiceGroup(jobService.name));
  }, [open, job, services.data]);

  const isNew = !job;
  const errors = touched ? validate(input, isNew) : {};
  const saving = create.isPending || update.isPending;
  const set = <K extends keyof JobInput>(key: K, value: JobInput[K]) => setInput((v) => ({ ...v, [key]: value }));

  // Hidden services cannot get new jobs, but an existing job keeps its own service in the list.
  const serviceOptions = (services.data ?? []).filter((s) => s.isActive || s.name === job?.service);
  const categoryServiceOptions = serviceOptions.filter(
    (service) => (service.category ?? getServiceGroup(service.name)) === serviceCategory,
  );
  const selected = serviceOptions.find((s) => s.name === input.service);
  const fee = selected && (input.urgency === 'Emergency' ? selected.emergencyVisitFee : selected.visitFee);

  const accountOptions = technicians.data?.items;
  const chooseAccount = (accountId: string) => {
    const account = accountOptions?.find((item) => item.id === accountId);
    // Start from the selected user's saved location; the admin can still change it.
    setInput((v) => ({ ...v, customerId: accountId, location: v.location || account?.location || '' }));
  };

  const save = () => {
    setTouched(true);
    if (Object.keys(validate(input, isNew)).length > 0) return;
    if (job) {
      const { service, problem, urgency, location } = input;
      update.mutate(
        { id: job.id, input: { service, problem, urgency, location } },
        {
          onSuccess: () => {
            toast(`Job ${job.reference} updated`);
            onClose();
          },
          onError: (err) => toast(err.message || 'Could not update the job', 'error'),
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: (created) => {
          toast(`Job ${created.reference} created`);
          onClose();
          router.push(`/admin/jobs/${created.id}`);
        },
        onError: (err) => toast(err.message || 'Could not create the job', 'error'),
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={job ? `Edit job ${job.reference}` : 'New job'}
      description={job ? 'Details can change until the visit fee is paid.' : 'Create a request on behalf of a technician.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {job ? 'Save changes' : 'Create job'}
          </Button>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={job ? 'Customer' : 'Technician'}
            htmlFor={`${id}-customer`}
            error={errors.customerId}
            hint={job ? 'The customer cannot be changed.' : undefined}
          >
            <Select
              id={`${id}-customer`}
              value={input.customerId}
              onChange={(e) => chooseAccount(e.target.value)}
              disabled={!isNew || technicians.isLoading}
              invalid={Boolean(errors.customerId)}
            >
              {job ? (
                <option value={job.customer.id}>{job.customer.name}</option>
              ) : (
                <>
                  <option value="">{technicians.isLoading ? 'Loading technicians…' : 'Choose a technician'}</option>
                  {accountOptions?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {account.location}
                    </option>
                  ))}
                </>
              )}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor={`${id}-service-category`}>
            <Select
              id={`${id}-service-category`}
              value={serviceCategory}
              onChange={(e) => {
                setServiceCategory(e.target.value as ServiceGroup | '');
                set('service', '');
              }}
              disabled={services.isLoading}
            >
              <option value="">{services.isLoading ? 'Loading categories…' : 'Choose a category'}</option>
              {SERVICE_GROUPS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Service" htmlFor={`${id}-service`} error={errors.service}>
            <Select
              id={`${id}-service`}
              value={input.service}
              onChange={(e) => set('service', e.target.value)}
              disabled={services.isLoading || !serviceCategory}
              invalid={Boolean(errors.service)}
            >
              <option value="">
                {services.isLoading
                  ? 'Loading services…'
                  : !serviceCategory
                    ? 'Choose a category first'
                    : 'Choose a service'}
              </option>
              {categoryServiceOptions.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Urgency"
            htmlFor={`${id}-urgency`}
            hint={fee !== undefined ? `Visit fee: ${formatMoney(fee)}` : undefined}
          >
            <Select id={`${id}-urgency`} value={input.urgency} onChange={(e) => set('urgency', e.target.value as Urgency)}>
              {URGENCIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Problem" htmlFor={`${id}-problem`} error={errors.problem}>
          <Textarea
            id={`${id}-problem`}
            value={input.problem}
            onChange={(e) => set('problem', e.target.value)}
            placeholder="e.g. Leaking pipe under the kitchen sink"
            invalid={Boolean(errors.problem)}
          />
        </Field>

        <Field label="Location" htmlFor={`${id}-location`} error={errors.location}>
          <Input
            id={`${id}-location`}
            value={input.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="e.g. Kimironko, Gasabo"
            invalid={Boolean(errors.location)}
          />
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
