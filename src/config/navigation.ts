import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Radio,
  GitMerge,
  Scale,
  Star,
  Wrench,
  Users,
  ShieldCheck,
  Tags,
  Megaphone,
  CreditCard,
  FileText,
  UserCog,
  History,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/types/user";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission; // Omit if accessible to all staff
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export const navigation: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Jobs", href: "/admin/jobs", icon: Briefcase, permission: "view:jobs" },
      { label: "Chats", href: "/admin/chats", icon: MessageSquare, permission: "manage:requests" },
      { label: "Broadcasts", href: "/admin/broadcasts", icon: Radio, permission: "manage:requests" },
      { label: "Matching", href: "/admin/matching", icon: GitMerge, permission: "manage:requests" },
      { label: "Disputes", href: "/admin/disputes", icon: Scale, permission: "manage:requests" },
      { label: "Ratings", href: "/admin/ratings", icon: Star, permission: "view:jobs" },
    ],
  },
  {
    title: "People",
    items: [
      { label: "Technicians", href: "/admin/technicians", icon: Wrench, permission: "manage:technicians" },
      { label: "Customers", href: "/admin/customers", icon: Users, permission: "manage:customers" },
      { label: "Staff", href: "/admin/staff", icon: ShieldCheck, permission: "manage:staff" },
    ],
  },
{
    title: "Business",
    items: [
      { label: "Categories", href: "/admin/categories", icon: Tags, permission: "manage:categories" },
      { label: "Landing Ads", href: "/admin/ads", icon: Megaphone, permission: "manage:categories" },
      { label: "Payments", href: "/admin/payments", icon: CreditCard, permission: "manage:finance" },
      { label: "Service Records", href: "/admin/records", icon: FileText, permission: "view:jobs" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Users", href: "/admin/users", icon: UserCog, permission: "manage:staff" },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: History, permission: "view:audit_logs" },
    ],
  },
];