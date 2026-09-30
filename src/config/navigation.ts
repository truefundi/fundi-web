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
    items: [{ label: 'Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Jobs', href: '/jobs', icon: Briefcase },
      { label: 'Matching', href: '/matching', icon: Shuffle },
      { label: 'Disputes', href: '/disputes', icon: Scale },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Technicians', href: '/technicians', icon: HardHat },
      { label: 'Customers', href: '/customers', icon: Users },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Categories', href: '/categories', icon: Tags },
      { label: 'Payments', href: '/payments', icon: CreditCard },
      { label: 'Service Records', href: '/records', icon: FileText },
    ],
  },
  {
    title: 'System',
    items: [{ label: 'Settings', href: '/settings', icon: Settings }],
  },
];
