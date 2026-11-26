'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  LogOut,
  MessagesSquare,
  Send,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { ConversationStatusBadge } from '@/components/chats/ConversationStatusBadge';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, ErrorState, Spinner } from '@/components/ui';
import { useChat, useJoinChat, useLeaveChat, useSendChatMessage } from '@/hooks/useChats';
import { cn, formatDate, formatPhone } from '@/lib/utils';
import type { ChatMessage, Conversation } from '@/types/chat';

const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

function detectTopicMismatch(chat: Conversation): string | null {
  const service = (chat.service ?? '').toLowerCase();
  const combinedText = `${chat.problem ?? ''} ${chat.messages.map((m) => m.text ?? '').join(' ')}`.toLowerCase();
  if (!service.trim() || !combinedText.trim()) return null;

  const groups: Record<string, string[]> = {
    'Appliance Repair': ['fridge', 'refrigerator', 'washer', 'washing machine', 'oven', 'stove', 'microwave', 'dryer', 'dishwasher', 'ac', 'air conditioner'],
    'Auto / Car Repair': ['car', 'vehicle', 'engine', 'brake', 'transmission', 'tire', 'tyre', 'mechanic', 'exhaust', 'radiator'],
    'Plumbing': ['pipe', 'leak', 'faucet', 'tap', 'drain', 'toilet', 'sink', 'sewer', 'water heater'],
    'Electrical': ['wiring', 'outlet', 'socket', 'breaker', 'fuse', 'voltage', 'lighting', 'switch', 'generator'],
  };

  for (const [label, keywords] of Object.entries(groups)) {
    const isCurrentService = service.includes(label.toLowerCase().split(' ')[0]);
    if (isCurrentService) continue;
    if (keywords.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(combinedText))) {
      return `Category is "${chat.service}", but the request or messages mention ${label.toLowerCase()} keywords.`;
    }
  }
  return null;
}

function BackLink() {
  return (
    <Link href="/admin/chats" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Chats
    </Link>
  );
}

function Message({ message, chat }: { message: ChatMessage; chat: Conversation }) {
  if (message.sender === 'system') {
    return (
      <li className="flex justify-center">
        <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{message.text}</p>
      </li>
    );
  }
  const fromTechnician = message.sender === 'technician';
  const isAdmin = message.sender === 'admin';
  const name =
    message.senderName ??
    (fromTechnician ? chat.technician.name : message.sender === 'customer' ? chat.customer.name : 'Fundi Admin');
  return (
    <li className={cn('flex flex-col gap-1', isAdmin ? 'items-center' : fromTechnician ? 'items-end' : 'items-start')}>
      <span className="text-xs text-slate-500">
        {name} · {time.format(new Date(message.at))}
      </span>
      <p
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
          isAdmin
            ? 'rounded-b-sm bg-indigo-100 text-indigo-900'
            : fromTechnician
              ? 'rounded-tr-sm bg-brand-500 text-white'
              : 'rounded-tl-sm bg-slate-100 text-slate-800',
        )}
      >
        {message.text}
      </p>
    </li>
  );
}

function Outcome({ chat }: { chat: Conversation }) {
  if (chat.status === 'agreed' && chat.jobId) {
    return (
      <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden />
        <div className="text-sm">
          <p className="font-semibold text-green-800">They agreed</p>
          <Link href={`/admin/jobs/${chat.jobId}`} className="mt-1 inline-flex items-center gap-1 font-medium text-green-700 hover:underline">
            <Briefcase className="h-4 w-4" aria-hidden /> Open job {chat.jobReference}
          </Link>
        </div>
      </div>
    );
  }
  if (chat.status === 'pending' || chat.status === 'expired') {
    return <p className="text-sm text-slate-600">{chat.status === 'pending' ? 'Waiting for the technician to accept the request.' : 'This negotiation has expired.'}</p>;
  }
  if (chat.status === 'declined') {
    return (
      <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <XCircle className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
        <div className="text-sm">
          <p className="font-semibold text-slate-800">The customer declined</p>
          {chat.declineReason && <p className="mt-0.5 text-slate-600">{chat.declineReason}</p>}
          {chat.nextConversationId && (
            <Link
              href={`/admin/chats/${chat.nextConversationId}`}
              className="mt-1 inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
            >
              See who they chose instead <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <MessagesSquare className="h-5 w-5 shrink-0 text-blue-600" aria-hidden />
      <p className="text-sm text-blue-800">
        <span className="font-semibold">Awaiting agreement.</span> The request is linked to a job.
      </p>
    </div>
  );
}

export function ChatDetailView({ id }: { id: string }) {
  const { data: chat, isLoading, isError, error, refetch } = useChat(id) as {
    data: Conversation | undefined;
    isLoading: boolean;
    isError: boolean;
    error: (Error & { statusCode?: number }) | null;
    refetch: () => void;
  };
  const joinChat = useJoinChat();
  const leaveChat = useLeaveChat();
  const sendMessage = useSendChatMessage();
  const [draft, setDraft] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

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

  if (isError || !chat) {
    const notFound = error?.statusCode === 404;
    return (
      <>
        <BackLink />
        <Card>
          {notFound ? (
            <EmptyState icon={MessagesSquare} title="Conversation not found" description="It may have been removed." />
          ) : (
            <ErrorState message={error?.message} onRetry={() => refetch()} />
          )}
        </Card>
      </>
    );
  }

  const mismatchWarning = detectTopicMismatch(chat);
  const formattedCustomerPhone = formatPhone(chat.customer.phone);
  const customerLabel = formattedCustomerPhone
    ? `${chat.customer.name} · ${formattedCustomerPhone}`
    : chat.customer.name;

  async function handleJoin() {
    setActionError(null);
    try {
      await joinChat.mutateAsync(chat!.id);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to join conversation.');
    }
  }

  async function handleLeave() {
    setActionError(null);
    try {
      await leaveChat.mutateAsync(chat!.id);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to leave conversation.');
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setActionError(null);
    try {
      if (!chat!.adminHasJoined) {
        await joinChat.mutateAsync(chat!.id);
      }
      await sendMessage.mutateAsync({ id: chat!.id, text: trimmed });
      setDraft('');
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to send admin message.');
    }
  }

  return (
    <>
      <BackLink />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {chat.customer.name} &amp; {chat.technician.name}
            </h1>
            <ConversationStatusBadge status={chat.status} />
            {chat.adminHasJoined && <Badge tone="info">Admin Joined</Badge>}
            {mismatchWarning && <Badge tone="warning">Topic Check</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {chat.service} · Started {formatDate(chat.startedAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {chat.adminHasJoined ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLeave}
              disabled={leaveChat.isPending}
            >
              <LogOut className="mr-1.5 h-4 w-4" aria-hidden />
              {leaveChat.isPending ? 'Leaving…' : 'Leave Chat'}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleJoin}
              disabled={joinChat.isPending}
            >
              <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
              {joinChat.isPending ? 'Joining…' : 'Join to Intervene'}
            </Button>
          )}
        </div>
      </div>

      {mismatchWarning && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <div>
              <p className="font-semibold">Possible Category / Topic Mismatch</p>
              <p className="mt-0.5 text-amber-800">
                {mismatchWarning} You can step in to guide both parties or check the linked job.
              </p>
            </div>
          </div>
          {!chat.adminHasJoined && (
            <Button size="sm" variant="secondary" onClick={handleJoin} disabled={joinChat.isPending}>
              Intervene
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Conversation"
            description="Review messages between the customer and technician, or step in as admin."
          />
          <CardBody className="space-y-6">
            {chat.messages.length === 0 ? (
              <p className="text-sm text-slate-500">No messages in this conversation yet.</p>
            ) : (
              <ol className="space-y-4">
                {chat.messages.map((message: ChatMessage) => (
                  <Message key={message.id} message={message} chat={chat} />
                ))}
              </ol>
            )}

            <form onSubmit={handleSend} className="border-t border-slate-100 pt-4">
              <label htmlFor="admin-chat-reply" className="mb-2 block text-xs font-medium text-slate-600">
                Admin intervention message {chat.adminHasJoined ? '(active in thread)' : '(auto-joins thread on send)'}
              </label>
              <div className="flex gap-2">
                <input
                  id="admin-chat-reply"
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a guidance or moderation note to both parties…"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
                />
                <Button type="submit" size="sm" disabled={!draft.trim() || sendMessage.isPending || joinChat.isPending}>
                  <Send className="mr-1.5 h-4 w-4" aria-hidden />
                  {sendMessage.isPending ? 'Sending…' : 'Send'}
                </Button>
              </div>
              {actionError && <p className="mt-2 text-xs text-rose-600">{actionError}</p>}
            </form>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Outcome" />
            <CardBody>
              <Outcome chat={chat} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Details" />
            <CardBody>
              <dl className="divide-y divide-slate-100 text-sm">
                {(
                  [
                    ['Problem', chat.problem],
                    ['Customer', customerLabel],
                    ['Technician', <Link key="t" href={`/admin/technicians/${chat.technician.id}`} className="text-brand-600 hover:text-brand-700">{chat.technician.name}</Link>],
                    ['Messages', chat.messages.filter((m: ChatMessage) => m.sender !== 'system').length],
                  ] as [string, React.ReactNode][]
                ).map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-right font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}