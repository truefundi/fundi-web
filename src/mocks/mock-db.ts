/**
 * In-memory mock database seeded from the JSON files in this folder.
 * Used while the backend admin endpoints are not ready (NEXT_PUBLIC_USE_MOCKS=true).
 * Mutations persist until the page is reloaded.
 */
import customersSeed from './customers.json';
import jobsSeed from './jobs.json';
import servicesSeed from './services.json';
import techniciansSeed from './technicians.json';
import type { Customer } from '@/types/customer';
import type { Job } from '@/types/job';
import type { Service } from '@/types/service';
import type { Technician } from '@/types/technician';

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/** The moment jobs.json was generated for. */
const JOBS_SEEDED_AT = Date.parse('2026-10-05T09:00:00.000Z');

/**
 * Moves every job date forward so the newest jobs are always recent, keeping the gaps
 * between events. Without this, open requests would look days old in every demo.
 */
function freshJobs(jobs: Job[]): Job[] {
  const offset = Math.max(0, Date.now() - JOBS_SEEDED_AT);
  const shift = (iso: string) => new Date(Date.parse(iso) + offset).toISOString();
  return jobs.map((job) => ({
    ...job,
    createdAt: shift(job.createdAt),
    updatedAt: shift(job.updatedAt),
    ...(job.completedAt && { completedAt: shift(job.completedAt) }),
    events: job.events.map((event) => ({ ...event, at: shift(event.at) })),
  }));
}

export const mockDb = {
  customers: clone(customersSeed) as Customer[],
  technicians: clone(techniciansSeed) as Technician[],
  jobs: freshJobs(clone(jobsSeed) as Job[]),
  services: clone(servicesSeed) as Service[],
};

/** Simulated network latency so loading states are visible. */
export function delay(min = 300, max = 500) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

export class MockNotFoundError extends Error {
  statusCode = 404;
  constructor(entity: string, id: string) {
    super(`${entity} ${id} not found`);
    this.name = 'NotFoundError';
  }
}
