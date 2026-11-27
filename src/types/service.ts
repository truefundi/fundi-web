
/** A category that groups related services. */
export interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A service customers can request and technicians can offer. */
export interface Service {
  id: string;
  categoryId: string;
  name: string;
  category: string;
  description: string;
  visitFee: number;
  emergencyVisitFee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  keywords?: string;
  icon?: string | null;
  sosBookingFee?: number | null;
}

/** Fields required when creating or updating a service. */
export type ServiceInput = {
  name: string;
  categoryId: string;
  category: string;
  description: string;
  visitFee: number;
  emergencyVisitFee: number;
  isActive: boolean;
  keywords?: string;
  icon?: string | null;
  sosBookingFee?: number | null;
};
