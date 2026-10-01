import {
  Briefcase,
  CreditCard,
  FileText,
  HardHat,
  LayoutDashboard,
  Scale,
  Settings,
  Shuffle,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/**
 * Sidebar navigation, grouped by admin responsibility
 * (see Fundi Overall Project Description, §2 "Fundi/Admin" and §11 "Admin/operations").
 */
export const navigation: NavSection[] = [
  {
    items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Jobs', href: '/admin/jobs', icon: Briefcase },
      { label: 'Matching', href: '/admin/matching', icon: Shuffle },
      { label: 'Disputes', href: '/admin/disputes', icon: Scale },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Technicians', href: '/admin/technicians', icon: HardHat },
      { label: 'Customers', href: '/admin/customers', icon: Users },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Categories', href: '/admin/categories', icon: Tags },
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { label: 'Service Records', href: '/admin/records', icon: FileText },
    ],
  },
  {
    title: 'System',
    items: [{ label: 'Settings', href: '/admin/settings', icon: Settings }],
  },
];
