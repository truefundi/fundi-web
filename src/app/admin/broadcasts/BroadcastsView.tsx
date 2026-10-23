'use client';

import { useState } from 'react';
import { BellRing, MessageSquareText, Send } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Textarea } from '@/components/ui';
import { env } from '@/config/env';
import { useBroadcastPreview, useBroadcasts, useSendBroadcast } from '@/hooks/useBroadcasts';
import type { BroadcastChannel, BroadcastRole } from '@/types/broadcast';

const ROLES: { value: BroadcastRole; label: string }[] = [
  { value: 'CUSTOMER', label: 'Customers' },
  { value: 'TECHNICIAN', label: 'Technicians' },
];

const CHANNELS: { value: BroadcastChannel; label: string }[] = [
  { value: 'SMS', label: 'SMS to phone number' },
  { value: 'IN_APP', label: 'In-app notification' },
];

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function BroadcastsView() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [roles, setRoles] = useState<BroadcastRole[]>(['CUSTOMER', 'TECHNICIAN']);
  const [channels, setChannels] = useState<BroadcastChannel[]>(['SMS', 'IN_APP']);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const preview = useBroadcastPreview(roles);
  const history = useBroadcasts();
  const send = useSendBroadcast();

  function toggleRole(role: BroadcastRole) {
    setRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
    setAuthorized(false);
    setError('');
  }

  function toggleChannel(channel: BroadcastChannel) {
    setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]);
    setAuthorized(false);
    setError('');
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!env.useMocks) {
      setError('Broadcast delivery is not configured yet. Enable mock mode to simulate a broadcast.');
      return;
    }
    if (roles.length === 0) {
      setError('Select at least one recipient group.');
      return;
    }
    if (channels.length === 0) {
      setError('Select at least one delivery channel.');
      return;
    }
    if (!authorized) {
      setError('Confirm that you are authorized to contact the selected recipients.');
      return;
    }
    if (!preview.data || preview.data.userCount === 0) {
      setError('There are no active recipients in the selected groups.');
      return;
    }

    try {
      const result = await send.mutateAsync({
        title: title.trim(),
        message: message.trim(),
        audience: { roles, status: 'active' },
        channels,
      });
      setSuccess(
        `Simulation saved for ${result.userCount} active users (${result.smsRecipientCount} SMS recipients, ${result.inAppRecipientCount} in-app recipients). No messages were delivered.`,
      );
      setTitle('');
      setMessage('');
      setAuthorized(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not simulate the broadcast.');
    }
  }

  return (
    <>
      <PageHeader
        title="Broadcasts"
        description="Prepare a message for active customers and technicians."
      />

      <Card className="mb-8 max-w-4xl">
        <CardHeader
          title="Compose broadcast"
          description="Choose recipient groups, delivery channels, and write your notification."
          action={
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <BellRing className="h-5 w-5" aria-hidden />
            </span>
          }
        />
        <CardBody>
          <form onSubmit={submit} className="space-y-5">
            <Field label="Notification title" htmlFor="broadcast-title">
              <Input
                id="broadcast-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={80}
                minLength={2}
                placeholder="e.g. Important service update"
                required
              />
            </Field>

            <Field
              label="Message"
              htmlFor="broadcast-message"
              hint={`${message.length}/320 characters. Keep it concise for SMS.`}
            >
              <Textarea
                id="broadcast-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={320}
                minLength={1}
                placeholder="Write the message recipients will see."
                required
              />
            </Field>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium text-slate-700">Recipients</legend>
              {ROLES.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={roles.includes(value)}
                    onChange={() => toggleRole(value)}
                    className="h-4 w-4 accent-brand-500"
                  />
                  {label}
                </label>
              ))}
              <p className="text-xs text-slate-500">Only accounts with active status are included. Admin accounts are excluded.</p>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium text-slate-700">Delivery channels</legend>
              {CHANNELS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={channels.includes(value)}
                    onChange={() => toggleChannel(value)}
                    className="h-4 w-4 accent-brand-500"
                  />
                  {label}
                </label>
              ))}
            </fieldset>

            {roles.length > 0 && (
              <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Active recipients</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {preview.isLoading ? '…' : preview.data?.userCount ?? '—'}
                  </p>
                </div>
                {channels.includes('SMS') && (
                  <div>
                    <p className="text-xs text-slate-500">With phone numbers</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {preview.isLoading ? '…' : preview.data?.smsRecipientCount ?? '—'}
                    </p>
                  </div>
                )}
                {channels.includes('IN_APP') && (
                  <div>
                    <p className="text-xs text-slate-500">In-app recipients</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {preview.isLoading ? '…' : preview.data?.inAppRecipientCount ?? '—'}
                    </p>
                  </div>
                )}
                {preview.isError && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{preview.error.message}</p>}
              </div>
            )}

            <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              <input
                type="checkbox"
                checked={authorized}
                onChange={(event) => setAuthorized(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-500"
              />
              <span>I am authorized to contact the selected active users and have verified this message is appropriate for them.</span>
            </label>

            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {success && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>}

            <Button
              type="submit"
              loading={send.isPending}
              disabled={!env.useMocks || preview.isLoading || preview.isError || !preview.data?.userCount}
            >
              <Send className="h-4 w-4" aria-hidden />
              Send Notification
            </Button>
          </form>
        </CardBody>
      </Card>

      <section aria-labelledby="broadcast-history-heading">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 text-slate-500" aria-hidden />
          <h2 id="broadcast-history-heading" className="text-lg font-semibold text-slate-900">Recent broadcasts</h2>
        </div>
        {history.isError ? (
          <Card className="p-4 text-sm text-red-700" role="alert">{history.error.message}</Card>
        ) : history.isLoading ? (
          <Card className="p-4 text-sm text-slate-500">Loading broadcast history…</Card>
        ) : history.data?.length ? (
          <div className="space-y-3">
            {history.data.map((broadcast) => (
              <Card key={broadcast.id} className="p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{broadcast.title}</h3>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Simulated</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{broadcast.message}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {broadcast.audience.roles.map((role) => role === 'CUSTOMER' ? 'Customers' : 'Technicians').join(', ')}
                      {' · '}{broadcast.channels.join(' + ')}{' · '}{formatCreatedAt(broadcast.createdAt)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm text-slate-600">
                    {broadcast.userCount} active · {broadcast.smsRecipientCount} phone numbers
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center text-sm text-slate-500">No broadcasts yet.</Card>
        )}
      </section>
    </>
  );
}
