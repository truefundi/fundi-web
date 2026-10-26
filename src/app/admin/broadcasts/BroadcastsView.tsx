'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  BellRing,
  CalendarDays,
  Clock,
  MessageSquareText,
  Plus,
  Send,
} from 'lucide-react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Modal,
  PageHeader,
  Textarea,
} from '@/components/ui';
import { env } from '@/config/env';
import {
  useBroadcastPreview,
  useBroadcasts,
  useSendBroadcast,
} from '@/hooks/useBroadcasts';
import {
  MOCK_BROADCASTS,
  type MockBroadcast,
} from '@/mocks/broadcasts';
import type {
  BroadcastChannel,
  BroadcastRole,
} from '@/types/broadcast';

const ROLES: { value: BroadcastRole; label: string }[] = [
  { value: 'CUSTOMER', label: 'Customers' },
  { value: 'TECHNICIAN', label: 'Technicians' },
];

const CHANNELS: { value: BroadcastChannel; label: string }[] = [
  { value: 'SMS', label: 'SMS to phone number' },
  { value: 'IN_APP', label: 'In-app notification' },
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function BroadcastsView() {
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [roles, setRoles] = useState<BroadcastRole[]>([
    'CUSTOMER',
    'TECHNICIAN',
  ]);
  const [channels, setChannels] = useState<BroadcastChannel[]>([
    'SMS',
    'IN_APP',
  ]);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const preview = useBroadcastPreview(roles);
  const history = useBroadcasts();
  const send = useSendBroadcast();

  const [localBroadcasts, setLocalBroadcasts] = useState<MockBroadcast[]>([]);

  const historyData = history.data as MockBroadcast[] | undefined;
  const historyRecords: MockBroadcast[] =
    historyData && historyData.length > 0 ? historyData : MOCK_BROADCASTS;

  const broadcasts: MockBroadcast[] = [
    ...localBroadcasts,
    ...historyRecords,
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  function openCompose() {
    setError('');
    setSuccess('');
    setShowCompose(true);
  }

  function closeCompose() {
    setShowCompose(false);
    setError('');
    setSuccess('');
  }

  function toggleRole(role: BroadcastRole) {
    setRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
    setAuthorized(false);
    setError('');
  }

  function toggleChannel(channel: BroadcastChannel) {
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel],
    );
    setAuthorized(false);
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!env.useMocks) {
      setError(
        'Broadcast delivery is not configured yet. Enable mock mode to simulate a broadcast.',
      );
      return;
    }

    if (title.trim().length < 2) {
      setError('The notification title must contain at least 2 characters.');
      return;
    }

    if (!message.trim()) {
      setError('Enter a message before continuing.');
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

      const newBroadcast: MockBroadcast = {
        id: `local-${Date.now()}`,
        title: title.trim(),
        message: message.trim(),
        audience: { roles: [...roles], status: 'active' },
        channels: [...channels],
        createdAt: new Date().toISOString(),
        userCount: result.userCount,
        smsRecipientCount: result.smsRecipientCount,
        inAppRecipientCount: result.inAppRecipientCount,
      };

      setLocalBroadcasts((current) => [newBroadcast, ...current]);
      setSuccess(
        `Simulation saved for ${result.userCount} active users. No messages were delivered.`,
      );

      setTitle('');
      setMessage('');
      setAuthorized(false);
      setShowCompose(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not simulate the broadcast.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcasts"
        description="Manage notifications sent to customers and technicians."
        actions={
          <Button type="button" onClick={openCompose}>
            <Plus className="h-4 w-4" aria-hidden />
            Add New Notification
          </Button>
        }
      />

      {/* Success feedback alert */}
      {success && (
        <div
          role="status"
          className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 border border-emerald-200 shadow-sm"
        >
          {success}
        </div>
      )}

      {/* Modal Dialog for Composing Notification */}
      <Modal
        open={showCompose}
        onClose={closeCompose}
        title="Compose notification"
        description="Choose recipients, delivery channels, and write your message."
      >
        <form onSubmit={submit} className="space-y-5 py-2">
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
            <legend className="mb-2 text-sm font-medium text-slate-700">
              Recipients
            </legend>
            <div className="space-y-2">
              {ROLES.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={roles.includes(value)}
                    onChange={() => toggleRole(value)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Only active accounts are included. Admin accounts are excluded.
            </p>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium text-slate-700">
              Delivery channels
            </legend>
            <div className="space-y-2">
              {CHANNELS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={channels.includes(value)}
                    onChange={() => toggleChannel(value)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {roles.length > 0 && (
            <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3 border border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium">Active recipients</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {preview.isLoading ? '…' : (preview.data?.userCount ?? '—')}
                </p>
              </div>

              {channels.includes('SMS') && (
                <div>
                  <p className="text-xs text-slate-500 font-medium">With phone numbers</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {preview.isLoading ? '…' : (preview.data?.smsRecipientCount ?? '—')}
                  </p>
                </div>
              )}

              {channels.includes('IN_APP') && (
                <div>
                  <p className="text-xs text-slate-500 font-medium">In-app recipients</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {preview.isLoading ? '…' : (preview.data?.inAppRecipientCount ?? '—')}
                  </p>
                </div>
              )}

              {preview.isError && (
                <p className="text-sm text-red-700 sm:col-span-3" role="alert">
                  {preview.error.message}
                </p>
              )}
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <input
              type="checkbox"
              checked={authorized}
              onChange={(event) => setAuthorized(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-amber-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              I am authorized to contact the selected active users and have verified this message is appropriate for them.
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={closeCompose} disabled={send.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={send.isPending}
              disabled={
                !env.useMocks ||
                preview.isLoading ||
                preview.isError ||
                !preview.data?.userCount
              }
            >
              <Send className="h-4 w-4" aria-hidden />
              Send Notification
            </Button>
          </div>
        </form>
      </Modal>

      {/* Notification history section */}
      <section aria-labelledby="broadcast-history-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 text-slate-500" aria-hidden />
          <h2 id="broadcast-history-heading" className="text-lg font-semibold text-slate-900">
            Recent notifications
          </h2>
        </div>

        {history.isError && localBroadcasts.length === 0 ? (
          <Card className="p-4 text-sm text-red-700 border-red-200 bg-red-50" role="alert">
            {history.error.message}
          </Card>
        ) : history.isLoading && (!historyData || historyData.length === 0) ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            Loading notification history…
          </Card>
        ) : broadcasts.length > 0 ? (
          <div className="space-y-3">
            {broadcasts.map((broadcast) => (
              <Card key={broadcast.id} className="p-4 transition-all hover:shadow-sm sm:p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {broadcast.title}
                      </h3>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        Simulated
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                      {broadcast.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                        {formatDate(broadcast.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {formatTime(broadcast.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {broadcast.audience.roles
                        .map((role) => (role === 'CUSTOMER' ? 'Customers' : 'Technicians'))
                        .join(', ')}
                      {' · '}
                      {broadcast.channels.join(' + ')}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-lg bg-slate-50 p-3 sm:text-right border border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">
                      {broadcast.userCount} active users
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {broadcast.smsRecipientCount} phone numbers
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <BellRing className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="font-semibold text-slate-900">No notifications yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Create your first notification to get started.
            </p>
            <div className="mt-4 flex justify-center">
              <Button type="button" onClick={openCompose}>
                <Plus className="h-4 w-4" aria-hidden />
                Add New Notification
              </Button>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}