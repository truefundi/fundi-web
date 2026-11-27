import { Badge } from '@/components/ui';
import { additionalTotal, formatMoney, quoteTotal, repairTotal } from '@/lib/jobs';
import type { Job, QuoteLine } from '@/types/job';

function Lines({ parts, labour }: { parts: QuoteLine[]; labour: number }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
          <th className="pb-2 font-medium">Item</th>
          <th className="pb-2 text-right font-medium">Qty</th>
          <th className="pb-2 text-right font-medium">Price</th>
          <th className="pb-2 text-right font-medium">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {parts.map((line) => (
          <tr key={line.label}>
            <td className="py-2 text-slate-700">{line.label}</td>
            <td className="py-2 text-right text-slate-600">{line.quantity}</td>
            <td className="py-2 text-right text-slate-600">{formatMoney(line.unitPrice)}</td>
            <td className="py-2 text-right font-medium text-slate-900">{formatMoney(line.quantity * line.unitPrice)}</td>
          </tr>
        ))}
        <tr>
          <td className="py-2 text-slate-700" colSpan={3}>
            Labour
          </td>
          <td className="py-2 text-right font-medium text-slate-900">{formatMoney(labour)}</td>
        </tr>
      </tbody>
    </table>
  );
}

/** The diagnosis, the approved quote and any extra work, so the admin can see exactly what was charged. */
export function QuoteDetails({ job }: { job: Job }) {
  const { quote, additionalWork, additionalWorkApproved } = job;
  if (!quote) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Diagnosis</p>
        <p className="mt-1 text-sm text-slate-700">{quote.diagnosis}</p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Quote</p>
          <span className="text-sm font-semibold text-slate-900">{formatMoney(quoteTotal(quote))}</span>
        </div>
        <Lines parts={quote.parts} labour={quote.labour} />
      </div>

      {additionalWork && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">Extra work</p>
            <div className="flex items-center gap-2">
              <Badge tone={additionalWorkApproved ? 'success' : 'warning'}>
                {additionalWorkApproved ? 'Approved by customer' : 'Not approved'}
              </Badge>
              <span className="text-sm font-semibold text-slate-900">{formatMoney(additionalTotal(additionalWork))}</span>
            </div>
          </div>
          <p className="mb-3 text-sm text-slate-600">{additionalWork.reason}</p>
          <Lines parts={additionalWork.parts} labour={additionalWork.labour} />
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <p className="text-sm font-semibold text-slate-900">Repair total</p>
        <p className="text-base font-bold text-slate-900">{formatMoney(repairTotal(job))}</p>
      </div>
      {additionalWork && !additionalWorkApproved && (
        <p className="text-xs text-slate-500">Extra work is not included in the total until the customer approves it.</p>
      )}
    </div>
  );
}
