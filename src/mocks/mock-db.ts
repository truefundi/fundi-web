/**
 * In-memory mock database seeded from the JSON files in this folder.
 * Used while the backend admin endpoints are not ready (NEXT_PUBLIC_USE_MOCKS=true).
 * Mutations persist until the page is reloaded.
 */
import customersSeed from './customers.json';
import techniciansSeed from './technicians.json';
import adminsSeed from './admins.json';
import type { Account, Customer } from '@/types/customer';
import type { Technician } from '@/types/technician';

type MockAdmin = Account & { role: 'ADMIN' };

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const mockDb = {
  customers: clone(customersSeed) as Customer[],
  technicians: clone(techniciansSeed) as Technician[],
  admins: clone(adminsSeed) as MockAdmin[],
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
