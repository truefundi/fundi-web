'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, ChevronRight, MessagesSquare } from 'lucide-react';
import { ConversationStatusBadge } from '@/components/chats/ConversationStatusBadge';
import { Avatar, Card, EmptyState, ErrorState, PageHeader, SearchInput, SegmentedTabs } from '@/components/ui';
import { useChats } from '@/hooks/useChats';
import { useDebouncedValue, useUrlFilters } from '@/hooks/useUrlFilters';
import { cn, formatRelative } from '@/lib/utils';
import { CONVERSATION_STATUSES, CONVERSATION_STATUS_LABEL, type ConversationStatus } from '@/types/chat';

const FILTER_KEYS = ['search', 'status'] as const;
type Tab = 'all' | ConversationStatus;

export function ChatsView() {
  const { values, setParams } = useUrlFilters(FILTER_KEYS);
  const [search, setSearch] = useState(values.search ?? '');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (debouncedSearch !== (values.search ?? '')) setParams({ search: debouncedSearch });
  }, [debouncedSearch, values.search, setParams]);

  const status = values.status as ConversationStatus | undefined;
  const { data, isLoading, isError, error, refetch, isFetching } = useChats({ search: values.search, status });
  // Unfiltered list, only for the tab counts.
  const { data: all } = useChats({});

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: all?.length },
    ...CONVERSATION_STATUSES.map((s) => ({
      value: s,
      label: CONVERSATION_STATUS_LABEL[s],
      count: all?.filter((c) => c.status === s).length,
    })),
  ];

  return (
    <>
      <PageHeader
        title="Chats"
        description="Conversations where customers and technicians agree on a job before it starts."
      />

      <div className="mb-4 space-y-3">
        <SegmentedTabs
          label="Conversation status"
          tabs={tabs}
          value={status ?? 'all'}
          onChange={(tab) => setParams({ status: tab === 'all' ? undefined : tab })}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by customer, technician, service or job"
        />
      </div>

      <Card className={cn('overflow-hidden', isFetching && !isLoading && 'opacity-70 transition-opacity')}>
        {isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
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
            description={values.search || status ? 'Try a different search or tab.' : 'Customers have not started any chats yet.'}
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
                        <p className="text-sm font-semibold text-slate-900">{chat.customer.name}</p>
                        <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" aria-label="with" />
                        <p className="text-sm font-medium text-slate-700">{chat.technician.name}</p>
                        <span className="text-xs text-slate-400">· {chat.service}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{last?.text}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <ConversationStatusBadge status={chat.status} />
                      <span className="text-xs text-slate-400">
                        {chat.jobReference ? `${chat.jobReference} · ` : ''}
                        {formatRelative(chat.lastMessageAt)}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
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
