
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  ChevronRight,
  MessagesSquare,
  MessageCircle,
  Handshake,
  XCircle,
  ListFilter,
} from 'lucide-react';

import { ConversationStatusBadge } from '@/components/chats/ConversationStatusBadge';
import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
} from '@/components/ui';
import { useChats } from '@/hooks/useChats';
import { useDebouncedValue, useUrlFilters } from '@/hooks/useUrlFilters';
import { cn, formatRelative } from '@/lib/utils';
import {
  CONVERSATION_STATUS_LABEL,
  type ConversationStatus,
} from '@/types/chat';

const FILTER_KEYS = ['search', 'status'] as const;
type Tab = 'all' | ConversationStatus;

export function ChatsView() {
  const { values, setParams } = useUrlFilters(FILTER_KEYS);
  const [search, setSearch] = useState(values.search ?? '');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (debouncedSearch !== (values.search ?? '')) {
      setParams({ search: debouncedSearch });
    }
  }, [debouncedSearch, values.search, setParams]);

  const status = values.status as ConversationStatus | undefined;

  // Fetch all conversations without sending a status filter to the backend.
  const {
    data: allChats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useChats({});

  // Calculate summary counts from the complete conversation list.
  const summary = useMemo(() => {
    const chats = allChats ?? [];

    return {
      all: chats.length,
      negotiating: chats.filter((chat) => chat.status === 'negotiating').length,
      agreed: chats.filter((chat) => chat.status === 'agreed').length,
      declined: chats.filter((chat) => chat.status === 'declined').length,
    };
  }, [allChats]);

  // Apply search and status filters locally.
  const data = useMemo(() => {
    const chats = allChats ?? [];
    const term = (values.search ?? '').trim().toLowerCase();

    return chats.filter((chat) => {
      const matchesStatus = !status || chat.status === status;

      const matchesSearch =
        !term ||
        [
          chat.customer.name,
          chat.technician.name,
          chat.service,
          chat.problem,
          chat.jobReference ?? '',
        ].some((value) => value.toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [allChats, status, values.search]);

  const filters: {
    value: Tab;
    label: string;
    count: number;
    icon: typeof MessagesSquare;
    color: string;
    activeColor: string;
    barColor: string;
  }[] = [
    {
      value: 'all',
      label: 'All conversations',
      count: summary.all,
      icon: MessagesSquare,
      color: 'text-slate-600',
      activeColor: 'border-slate-900 bg-slate-900 text-white',
      barColor: 'bg-slate-500',
    },
    {
      value: 'negotiating',
      label: 'Negotiating',
      count: summary.negotiating,
      icon: MessageCircle,
      color: 'text-blue-600',
      activeColor: 'border-blue-600 bg-blue-50 text-blue-800',
      barColor: 'bg-blue-500',
    },
    {
      value: 'agreed',
      label: 'Agreed',
      count: summary.agreed,
      icon: Handshake,
      color: 'text-green-600',
      activeColor: 'border-green-600 bg-green-50 text-green-800',
      barColor: 'bg-green-500',
    },
    {
      value: 'declined',
      label: 'Declined',
      count: summary.declined,
      icon: XCircle,
      color: 'text-rose-600',
      activeColor: 'border-rose-600 bg-rose-50 text-rose-800',
      barColor: 'bg-rose-500',
    },
  ];

  return (
    <>
      <PageHeader
        title="Chats"
        description="Conversations where customers and technicians agree on a job before it starts."
      />

      {/* Chart summary and quick filters */}
      <section className="mb-6 space-y-3" aria-label="Conversation summary">

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const active =
              filter.value === 'all'
                ? !status
                : status === filter.value;

            const percentage =
              summary.all > 0
                ? (filter.count / summary.all) * 100
                : 0;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() =>
                  setParams({
                    status:
                      filter.value === 'all'
                        ? undefined
                        : filter.value,
                  })
                }
                aria-pressed={active}
                className={cn(
  'rounded-lg border bg-white p-3 text-left text-slate-900 shadow-sm transition-all',
  'hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
  active
    ? 'border-blue-600 ring-2 ring-blue-100 shadow-md'
    : 'border-slate-200',
)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      active ? 'bg-white/70' : 'bg-slate-50',
                      filter.color,
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-xs font-medium opacity-70">
                    {summary.all > 0
                      ? `${Math.round(percentage)}%`
                      : '0%'}
                  </span>
                </div>

                <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">
  {filter.count}
</p>

<p className="mt-0.5 text-xs font-medium text-slate-700">
  {filter.label}
</p>

                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      filter.barColor,
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by customer, technician, service or job"
        />
      </div>

      <Card
        className={cn(
          'overflow-hidden',
          isFetching && !isLoading && 'opacity-70 transition-opacity',
        )}
      >
        {isError ? (
          <ErrorState
            message={error.message}
            onRetry={() => refetch()}
          />
        ) : isLoading || !allChats ? (
          <ul className="divide-y divide-slate-100" aria-label="Loading">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex items-center gap-4 px-6 py-5">
                <span className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
                <span className="h-4 w-64 animate-pulse rounded bg-slate-200" />
              </li>
            ))}
          </ul>
        ) : data.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title="No conversations found"
            description={
              values.search || status
                ? 'Try a different search or filter.'
                : 'Customers have not started any chats yet.'
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.map((chat) => {
              const last = chat.messages[chat.messages.length - 1];

              return (
                <li key={chat.id}>
                  <Link
                    href={`/admin/chats/${chat.id}`}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                  >
                    <Avatar name={chat.customer.name} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {chat.customer.name}
                        </p>
                        <ArrowLeftRight
                          className="h-3.5 w-3.5 text-slate-400"
                          aria-label="with"
                        />
                        <p className="text-sm font-medium text-slate-700">
                          {chat.technician.name}
                        </p>
                        <span className="text-xs text-slate-400">
                          · {chat.service}
                        </span>
                      </div>

                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {chat.adminHasJoined
                          ? last?.text
                          : 'Join to view conversation'}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <ConversationStatusBadge status={chat.status} />
                      <span className="text-xs text-slate-400">
                        {chat.jobReference
                          ? `${chat.jobReference} · `
                          : ''}
                        {formatRelative(chat.lastMessageAt)}
                      </span>
                    </div>

                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-slate-400"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
