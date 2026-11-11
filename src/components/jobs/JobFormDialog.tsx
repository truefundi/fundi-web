
'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  useToast,
} from '@/components/ui';
import { useCreateJob, useUpdateJob } from '@/hooks/useJobs';
import { useServices } from '@/hooks/useServices';
import { env } from '@/config/env';
import { useCustomers } from '@/hooks/useCustomers';
import {
  getServiceGroup,
  SERVICE_GROUPS,
} from '@/config/services';
import { formatMoney } from '@/lib/jobs';
import {
  URGENCIES,
  type Job,
  type JobInput,
  type Urgency,
} from '@/types/job';

type JobFormInput = JobInput & {
  latitude: number;
  longitude: number;
  offeredAmount: number;
};

const EMPTY: JobFormInput = {
  customerId: '',
  paymentId: '',
  phoneVerificationId: '',
  partyType: 'customer',
  service: '',
  problem: '',
  urgency: 'Today',
  location: '',
  latitude: 0,
  longitude: 0,
  offeredAmount: 0,
};

type Errors = Partial<Record<keyof JobFormInput, string>>;

function validate(input: JobFormInput, isNew: boolean): Errors {
  const errors: Errors = {};

  if (isNew && !input.customerId) {
    errors.customerId = 'Choose a customer.';
  }

  if (isNew && !env.useMocks) {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuid.test(input.paymentId ?? '')) errors.paymentId = 'Enter a valid booking payment ID.';
    if (!uuid.test(input.phoneVerificationId ?? '')) errors.phoneVerificationId = 'Enter a verified phone reference ID.';
  }

  if (!input.service) {
    errors.service = 'Choose a service.';
  }

  if (input.problem.trim().length < 10 || input.problem.trim().length > 5000) {
    errors.problem = 'Describe the problem in 10–5000 characters.';
  }

  if (input.location.trim().length < 3) {
    errors.location = 'Enter where the technician should go.';
  }

  if (
    !Number.isInteger(input.offeredAmount) ||
    input.offeredAmount <= 0 || input.offeredAmount > 2_000_000_000
  ) {
    errors.offeredAmount = 'Enter a valid amount for the technician.';
  }

  if (
    !Number.isFinite(input.latitude) ||
    input.latitude < -90 ||
    input.latitude > 90
  ) {
    errors.latitude = 'Enter a valid latitude between -90 and 90.';
  }

  if (
    !Number.isFinite(input.longitude) ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    errors.longitude = 'Enter a valid longitude between -180 and 180.';
  }

  return errors;
}

export function JobFormDialog({
  open,
  onClose,
  job,
}: {
  open: boolean;
  onClose: () => void;
  job?: Job;
}) {
  const id = useId();
  const router = useRouter();
  const toast = useToast();

  const create = useCreateJob();
  const update = useUpdateJob();

  const customers = useCustomers({
    status: 'active',
    sort: 'name',
    page: 1,
    pageSize: 100,
  });

  const services = useServices();

  const [input, setInput] = useState<JobFormInput>(EMPTY);
  const [serviceCategory, setServiceCategory] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;

    setTouched(false);

    setInput(
      job
        ? {
            ...EMPTY,
            customerId: job.customer.id,
            partyType: 'customer',
            service: job.service,
            problem: job.problem,
            urgency: job.urgency,
            location: job.location,
            latitude: job.latitude ?? 0,
            longitude: job.longitude ?? 0,
            offeredAmount: job.offeredAmount ?? 0,
          }
        : EMPTY,
    );

    setServiceCategory('');
  }, [open, job]);

  useEffect(() => {
    if (!open || !job || !services.data) return;

    const jobService = services.data.find(
      (service) => service.name === job.service,
    );

    if (jobService) {
      setServiceCategory(
        jobService.category ?? getServiceGroup(jobService.name),
      );
    }
  }, [open, job, services.data]);

  const isNew = !job;
  const errors = touched ? validate(input, isNew) : {};
  const saving = create.isPending || update.isPending;

  const set = <K extends keyof JobFormInput>(
    key: K,
    value: JobFormInput[K],
  ) => {
    setInput((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const serviceOptions = (services.data ?? []).filter(
    (service) => service.isActive || service.name === job?.service,
  );

  const serviceCategories = [
    ...new Set([
      ...SERVICE_GROUPS,
      ...serviceOptions.map(
        (service) => service.category || getServiceGroup(service.name),
      ),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  const categoryServiceOptions = serviceOptions.filter(
    (service) =>
      (service.category ?? getServiceGroup(service.name)) ===
      serviceCategory,
  );

  const selected = serviceOptions.find(
    (service) => service.name === input.service,
  );

  const fee =
    selected &&
    (input.urgency === 'Emergency'
      ? selected.emergencyVisitFee
      : selected.visitFee);

  const accountOptions = customers.data?.items;

  const chooseAccount = (accountId: string) => {
    const account = accountOptions?.find(
      (item) => item.id === accountId,
    );

    setInput((current) => ({
      ...current,
      customerId: accountId,
      location: current.location || account?.location || '',
    }));
  };

  const save = () => {
    setTouched(true);

    if (Object.keys(validate(input, isNew)).length > 0) {
      return;
    }

    if (job) {
      const { service, problem, urgency, location, offeredAmount, latitude, longitude } =
        input;

      update.mutate(
        {
          id: job.id,
          input: {
            service,
            problem,
            urgency,
            location,
            offeredAmount,
            latitude,
            longitude,
          },
        },
        {
          onSuccess: () => {
            toast(`Job ${job.reference} updated`);
            onClose();
          },
          onError: (err) =>
            toast(err.message || 'Could not update the job', 'error'),
        },
      );

      return;
    }

    create.mutate(input, {
      onSuccess: (created) => {
        toast(`Job ${created.reference} created`);
        onClose();
        router.push(`/admin/jobs/${created.id}`);
      },
      onError: (err) =>
        toast(err.message || 'Could not create the job', 'error'),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={job ? `Edit job ${job.reference}` : 'New job'}
      description={
        job
          ? 'Details can change until the visit fee is paid.'
          : 'Create a request on behalf of a customer.'
      }
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
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
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Customer"
            htmlFor={`${id}-customer`}
            error={errors.customerId}
            hint={job ? 'The customer cannot be changed.' : undefined}
          >
            <Select
              id={`${id}-customer`}
              value={input.customerId}
              onChange={(event) => chooseAccount(event.target.value)}
              disabled={!isNew || customers.isLoading}
              invalid={Boolean(errors.customerId)}
            >
              {job ? (
                <option value={job.customer.id}>
                  {job.customer.name}
                </option>
              ) : (
                <>
                  <option value="">
                    {customers.isLoading
                      ? 'Loading customers…'
                      : 'Choose a customer'}
                  </option>

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
          <Field
            label="Category"
            htmlFor={`${id}-service-category`}
          >
            <Select
              id={`${id}-service-category`}
              value={serviceCategory}
              onChange={(event) => {
                setServiceCategory(event.target.value);
                set('service', '');
              }}
              disabled={services.isLoading}
            >
              <option value="">
                {services.isLoading
                  ? 'Loading categories…'
                  : 'Choose a category'}
              </option>

              {serviceCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Service"
            htmlFor={`${id}-service`}
            error={errors.service}
          >
            <Select
              id={`${id}-service`}
              value={input.service}
              onChange={(event) => set('service', event.target.value)}
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

              {categoryServiceOptions.map((service) => (
                <option key={service.id} value={service.name}>
                  {service.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Urgency"
            htmlFor={`${id}-urgency`}
            hint={
              fee !== undefined
                ? `Booking fee: ${formatMoney(fee)}`
                : 'Select the job urgency.'
            }
          >
            <Select
              id={`${id}-urgency`}
              value={input.urgency}
              onChange={(event) =>
                set('urgency', event.target.value as Urgency)
              }
            >
              {URGENCIES.map((urgency) => (
                <option key={urgency} value={urgency}>
                  {urgency}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {isNew && !env.useMocks && (
          <>
            <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              This customer must first pay the booking fee and verify their phone in the Fundi app.
              Use their unused payment and phone verification references to create the job.
            </p>
            <Field label="Booking payment ID" htmlFor={`${id}-payment`} error={errors.paymentId}>
              <Input id={`${id}-payment`} value={input.paymentId ?? ''} onChange={(event) => set('paymentId', event.target.value.trim())} />
            </Field>
            <Field label="Verified phone reference ID" htmlFor={`${id}-verification`} error={errors.phoneVerificationId}>
              <Input id={`${id}-verification`} value={input.phoneVerificationId ?? ''} onChange={(event) => set('phoneVerificationId', event.target.value.trim())} />
            </Field>
          </>
        )}

        <Field
          label="Problem description"
          htmlFor={`${id}-problem`}
          error={errors.problem}
        >
          <Textarea
            id={`${id}-problem`}
            value={input.problem}
            onChange={(event) => set('problem', event.target.value)}
            placeholder="e.g. Leaking pipe under the kitchen sink"
            invalid={Boolean(errors.problem)}
          />
        </Field>

        <Field
          label="Service address"
          htmlFor={`${id}-location`}
          error={errors.location}
        >
          <Input
            id={`${id}-location`}
            value={input.location}
            onChange={(event) => set('location', event.target.value)}
            placeholder="e.g. Kimironko, Gasabo"
            invalid={Boolean(errors.location)}
          />
        </Field>

        <Field
          label="Technician offered amount"
          htmlFor={`${id}-offered-amount`}
          error={errors.offeredAmount}
          hint="Amount payable to the technician. Excludes the booking fee."
        >
          <Input
            id={`${id}-offered-amount`}
            type="number"
            min="1"
            step="1"
            value={String(input.offeredAmount || '')}
            onChange={(event) =>
              set('offeredAmount', Number(event.target.value))
            }
            placeholder="Enter amount in RWF"
            invalid={Boolean(errors.offeredAmount)}
          />
        </Field>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Customer coordinates</p>
          <p className="text-xs text-gray-500">
            Enter the actual coordinates of the service location. Do not use
            estimated or invented coordinates.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Latitude"
              htmlFor={`${id}-latitude`}
              error={errors.latitude}
            >
              <Input
                id={`${id}-latitude`}
                type="number"
                step="any"
                min="-90"
                max="90"
                value={String(input.latitude || '')}
                onChange={(event) =>
                  set('latitude', Number(event.target.value))
                }
                placeholder="e.g. -1.9441"
                invalid={Boolean(errors.latitude)}
              />
            </Field>

            <Field
              label="Longitude"
              htmlFor={`${id}-longitude`}
              error={errors.longitude}
            >
              <Input
                id={`${id}-longitude`}
                type="number"
                step="any"
                min="-180"
                max="180"
                value={String(input.longitude || '')}
                onChange={(event) =>
                  set('longitude', Number(event.target.value))
                }
                placeholder="e.g. 30.0619"
                invalid={Boolean(errors.longitude)}
              />
            </Field>
          </div>
        </div>

        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
