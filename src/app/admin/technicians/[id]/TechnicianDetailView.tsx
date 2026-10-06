'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Clock, MapPin, Pencil, Phone, Radar, ShieldCheck, Star, UserX } from 'lucide-react';
import { AccountStatusAction, AccountStatusBadge } from '@/components/accounts/AccountStatus';
import { EditTechnicianDrawer } from '@/components/technicians/EditTechnicianDrawer';
import { VerificationPanel } from '@/components/technicians/VerificationPanel';
import { Avatar, Button, Card, CardBody, CardHeader, EmptyState, ErrorState, Spinner, StatCard } from '@/components/ui';
import { useTechnician, useUpdateTechnicianStatus } from '@/hooks/useTechnicians';
import { formatDate, formatPhone, formatRelative } from '@/lib/utils';
import { WORK_HOURS_LABEL } from '@/types/technician';

function BackLink() {
  return (
    <Link
      href="/admin/technicians"
      className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Technicians
    </Link>
  );
}

function Details({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-slate-100">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <dt className="text-sm text-slate-500">{label}</dt>
          <dd className="text-right text-sm font-medium text-slate-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TechnicianDetailView({ id }: { id: string }) {
  const { data: technician, isLoading, isError, error, refetch } = useTechnician(id);
  const updateStatus = useUpdateTechnicianStatus();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <>
        <BackLink />
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  if (isError || !technician) {
    const notFound = (error as { statusCode?: number } | null)?.statusCode === 404;
    return (
      <>
        <BackLink />
        <Card>
          {notFound ? (
            <EmptyState
              icon={UserX}
              title="Technician not found"
              description="This technician may have been removed, or the link is wrong."
            />
          ) : (
            <ErrorState message={error?.message} onRetry={() => refetch()} />
          )}
        </Card>
      </>
    );
  }

  const { workSettings } = technician;

  return (
    <>
      <BackLink />

      {/* Orange profile hero, as on the mobile profile screen */}
      <section className="flex flex-col gap-4 rounded-xl bg-brand-500 p-6 text-white shadow-sm sm:flex-row sm:items-center">
        <Avatar name={technician.name} size="lg" inverse />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-100">{technician.trades.join(' · ')}</p>
          <h1 className="mt-0.5 flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="truncate">{technician.name}</span>
            {technician.verification.status === 'verified' && (
              <ShieldCheck className="h-5 w-5 shrink-0" aria-label="Verified" />
            )}
          </h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-50">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {formatPhone(technician.phone)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {technician.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${technician.isAvailable ? 'bg-white' : 'bg-white/40'}`} aria-hidden />
              {technician.isAvailable ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <Button variant="secondary" className="border-white" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" aria-hidden />
          Edit profile
        </Button>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Rating"
          value={technician.jobsCompleted > 0 ? technician.rating.toFixed(1) : '—'}
          icon={Star}
        />
        <StatCard label="Jobs completed" value={technician.jobsCompleted} icon={Briefcase} />
        <StatCard label="Experience" value={`${technician.yearsExperience} yrs`} icon={Clock} />
        <StatCard label="Service radius" value={`${workSettings.radiusKm} km`} icon={Radar} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Profile"
              action={
                <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                  Edit
                </Button>
              }
            />
            <CardBody>
              <Details
                rows={[
                  ['Full name', technician.name],
                  ['Phone', formatPhone(technician.phone)],
                  ['Email', technician.email ?? '—'],
                  ['Location', technician.location],
                  ['Services', technician.trades.join(', ')],
                  ['Joined', formatDate(technician.createdAt)],
                  ['Last active', formatRelative(technician.lastActiveAt)],
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Work settings" />
            <CardBody>
              <Details
                rows={[
                  ['Service radius', `${workSettings.radiusKm} km`],
                  ['Max jobs per day', workSettings.maxJobsPerDay],
                  ['Working hours', WORK_HOURS_LABEL[workSettings.hours]],
                ]}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <VerificationPanel technician={technician} />

          <Card>
            <CardHeader title="Account" action={<AccountStatusBadge status={technician.status} />} />
            <CardBody className="space-y-4">
              <p className="text-sm text-slate-600">
                {technician.status === 'active'
                  ? 'This technician can sign in and receive jobs (once verified).'
                  : technician.status === 'suspended'
                    ? 'This account is suspended. The technician cannot sign in or receive jobs.'
                    : 'This account is inactive. Reactivating restores access.'}
              </p>
              <AccountStatusAction
                name={technician.name}
                status={technician.status}
                size="md"
                loading={updateStatus.isPending}
                onChange={(status) => updateStatus.mutateAsync({ id: technician.id, status })}
              />
            </CardBody>
          </Card>
        </div>
      </div>

      <EditTechnicianDrawer technician={technician} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
