import { cn, formatDate } from '@/lib/utils';
import { JOB_STATUS_TONE, type JobEvent } from '@/types/job';

const dotColour = { progress: 'bg-blue-500', action: 'bg-amber-500', success: 'bg-green-500', danger: 'bg-red-500' };

const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

/** Every status change on the job, newest first: the job's audit trail. */
export function JobTimeline({ events }: { events: JobEvent[] }) {
  const ordered = [...events].reverse();

  return (
    <ol className="relative space-y-6">
      {ordered.map((event, i) => (
        <li key={event.id} className="relative flex gap-4">
          {i < ordered.length - 1 && <span className="absolute left-[5px] top-4 h-[calc(100%+0.5rem)] w-px bg-slate-200" aria-hidden />}
          <span
            className={cn('relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', dotColour[JOB_STATUS_TONE[event.status]])}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <p className="text-sm font-medium text-slate-900">{event.title}</p>
              <time dateTime={event.at} className="text-xs text-slate-500">
                {formatDate(event.at)}, {time.format(new Date(event.at))}
              </time>
            </div>
            <p className="mt-0.5 text-sm text-slate-600">{event.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
