import {
  Car,
  Hammer,
  House,
  Snowflake,
  Truck,
  WashingMachine,
  Wrench,
  Zap,
  Layers,
  type LucideIcon,
} from 'lucide-react';

/**
 * Built-in skilled-service categories required by Fundi.
 */
export const SERVICE_CATEGORIES = [
  'Electrical',
  'Plumbing',
  'HVAC',
  'Appliance Repair',
  'Home Repair',
  'General Maintenance',
  'Car & Garage',
  'Truck & Mechanical',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

/** Main groups displayed in Service Management. */
export const SERVICE_GROUPS = [
  'Home Services',
  'Car Services',
  'Other Services',
] as const;

export type ServiceGroup = (typeof SERVICE_GROUPS)[number];

/** Explicit mapping of built-in categories to their main groups. */
const CATEGORY_GROUP_MAP: Record<ServiceCategory, ServiceGroup> = {
  Electrical: 'Home Services',
  Plumbing: 'Home Services',
  HVAC: 'Home Services',
  'Appliance Repair': 'Home Services',
  'Home Repair': 'Home Services',
  'General Maintenance': 'Home Services',
  'Car & Garage': 'Car Services',
  'Truck & Mechanical': 'Car Services',
};

/**
 * Maps any category or service name to its main group.
 */
/**
 * Maps any category or service name to its main group.
 */
/**
 * Maps any category or service name to its main group.
 */
export function getServiceGroup(category?: string): ServiceGroup {
  if (!category) return 'Other Services';
  const normalized = category.trim().toLowerCase();

  if (normalized.includes('car') || normalized.includes('garage') || normalized.includes('auto')) {
    return 'Car Services';
  }
  if (normalized.includes('plumb') || normalized.includes('electric') || normalized.includes('home')) {
    return 'Home Services';
  }
  return 'Other Services';
}

/** Icons and colours for built-in trades. */
export const SERVICE_CATEGORY_STYLE: Record<
  ServiceCategory,
  { icon: LucideIcon; className: string }
> = {
  Electrical: {
    icon: Zap,
    className: 'bg-yellow-100 text-yellow-700',
  },
  Plumbing: {
    icon: Wrench,
    className: 'bg-teal-100 text-teal-700',
  },
  HVAC: {
    icon: Snowflake,
    className: 'bg-sky-100 text-sky-700',
  },
  'Appliance Repair': {
    icon: WashingMachine,
    className: 'bg-rose-100 text-rose-700',
  },
  'Home Repair': {
    icon: House,
    className: 'bg-purple-100 text-purple-700',
  },
  'General Maintenance': {
    icon: Hammer,
    className: 'bg-amber-100 text-amber-700',
  },
  'Car & Garage': {
    icon: Car,
    className: 'bg-blue-100 text-blue-700',
  },
  'Truck & Mechanical': {
    icon: Truck,
    className: 'bg-green-100 text-green-700',
  },
};

export const DEFAULT_CATEGORY_STYLE = {
  icon: Layers,
  className: 'bg-slate-100 text-slate-600',
};