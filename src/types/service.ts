import type { ServiceGroup } from '@/config/services';

/** A service category customers can request and technicians can offer. */
export interface Service {
  id: string;
  name: string;
  category: ServiceGroup;
  description: string;
  /** Visit/diagnostic fee in USD (Project Description §8: configurable, not hard-coded). */
  visitFee: number;
  /** Visit fee when the customer marks the request as an emergency. */
  emergencyVisitFee: number;
  /** Hidden services stay in history but customers cannot request them. */
  isActive: boolean;
  createdAt: string;
}

/** Fields the admin fills in when adding or editing a service. */
export type ServiceInput = Pick<Service, 'name' | 'category' | 'description' | 'visitFee' | 'emergencyVisitFee' | 'isActive'>;
