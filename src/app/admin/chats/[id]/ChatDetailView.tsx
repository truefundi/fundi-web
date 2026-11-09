'use client';

import { env } from '@/config/env';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Briefcase, CheckCircle2, Info, LogIn, LogOut, MessagesSquare, Send, XCircle } from 'lucide-react';
import { ConversationStatusBadge } from '@/components/chats/ConversationStatusBadge';
import { Button, Card, CardBody, CardHeader, EmptyState, ErrorState, Spinner, Textarea, useToast } from '@/components/ui';
import { useChat, useJoinChat, useLeaveChat, useSendChatMessage } from '@/hooks/useChats';
import { cn, formatDate, formatPhone } from '@/lib/utils';
import type { ChatMessage, Conversation } from '@/types/chat';

const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

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
  const router = useRouter();
  const toast = useToast();
  const [messageText, setMessageText] = useState('');
  const joinChat = useJoinChat();
  const sendMessage = useSendChatMessage();
  const leaveChat = useLeaveChat();
  const { data: chat, isLoading, isError, error, refetch } = useChat(id);

  const submitMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || sendMessage.isPending || leaveChat.isPending) return;
    sendMessage.mutate(
      { id, text },
      {
        onSuccess: () => setMessageText(''),
        onError: (err) => toast(err.message || 'Could not send your message', 'error'),
      },
    );
  };

  const leave = () => {
    leaveChat.mutate(id, {
      onSuccess: () => {
        toast('You left the conversation. The customer and technician can keep chatting.');
        router.push('/admin/chats');
      },
      onError: (err) => toast(err.message || 'Could not leave the conversation', 'error'),
    });
  };

  const join = () => {
    joinChat.mutate(id, {
      onSuccess: () => toast('You joined the conversation. You can now view and message both participants.'),
      onError: (err) => toast(err.message || 'Could not join the conversation', 'error'),
    });
  };

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
    const notFound = (error as { statusCode?: number } | null)?.statusCode === 404;
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

  return (
    <>
      <BackLink />
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {chat.customer.name} &amp; {chat.technician.name}
          </h1>
          <ConversationStatusBadge status={chat.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {chat.service} · Started {formatDate(chat.startedAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Conversation"
            description={
              !env.useMocks ? 'Review messages between the customer and technician.' : chat.adminHasJoined
                ? 'Your messages are visible to both the customer and technician.'
                : 'Join this conversation to view its messages and participate.'
            }
            action={
              !env.useMocks ? undefined : chat.adminHasJoined ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={leave}
                  loading={leaveChat.isPending}
                  disabled={sendMessage.isPending || joinChat.isPending}
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Leave chat
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={join}
                  loading={joinChat.isPending}
                  disabled={leaveChat.isPending || sendMessage.isPending}
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  Join chat
                </Button>
              )
            }
          />
          <CardBody>
            {!chat.adminHasJoined ? (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Info className="h-4 w-4 shrink-0" aria-hidden />
                You are not a participant yet. Join to view the conversation; leaving later will not affect the customer and technician.
              </p>
            ) : (
              <>
                <ol className="space-y-4">
                  {chat.messages.map((message) => (
                    <Message key={message.id} message={message} chat={chat} />
                  ))}
                </ol>
                {env.useMocks && <form onSubmit={submitMessage} className="mt-6 space-y-3 border-t border-slate-100 pt-4">
                  <label htmlFor="admin-chat-message" className="sr-only">
                    Message both participants
                  </label>
                  <Textarea
                    id="admin-chat-message"
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Write a message to the customer and technician…"
                    rows={3}
                    disabled={leaveChat.isPending}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">Both participants will see your message.</p>
                    <Button
                      type="submit"
                      size="sm"
                      loading={sendMessage.isPending}
                      disabled={!messageText.trim() || leaveChat.isPending}
                    >
                      <Send className="h-4 w-4" aria-hidden />
                      Send message
                    </Button>
                  </div>
                </form>}
              </>
            )}
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
                    ['Customer', `${chat.customer.name} · ${formatPhone(chat.customer.phone)}`],
                    ['Technician', <Link key="t" href={`/admin/technicians/${chat.technician.id}`} className="text-brand-600 hover:text-brand-700">{chat.technician.name}</Link>],
                    ['Messages', chat.messages.filter((m) => m.sender !== 'system').length],
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
