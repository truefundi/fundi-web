import {
  BadgeCheck,
  BellRing,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  MapPin,
  MessageSquareText,
  PhoneOff,
  Power,
  Receipt,
  Search,
  ShieldCheck,
  Star,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { ServiceCategory } from '@/config/services';

/**
 * Landing page copy. Based on the Fundi Overall Project Description; items marked
 * as placeholders should be replaced once final content is available.
 */

export const navLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Services', href: '#services' },
  { label: 'For customers', href: '#customers' },
  { label: 'For technicians', href: '#technicians' },
  { label: 'FAQ', href: '#faq' },
];

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const steps: Feature[] = [
  {
    icon: MessageSquareText,
    title: 'Tell us what is wrong',
    description: 'Pick a service, describe the problem, add photos and your location, and choose how urgent it is.',
  },
  {
    icon: Search,
    title: 'Fundi finds who can fix it',
    description: 'We match you with a qualified technician nearby who is available now, and show you how long it will take them to arrive.',
  },
  {
    icon: ClipboardCheck,
    title: 'Diagnose and approve',
    description: 'The technician inspects the problem and sends a clear quote. Nothing is charged until you approve it.',
  },
  {
    icon: Star,
    title: 'Repair, settle and rate',
    description: 'The work gets done, you record how you paid, and you rate the service. Every job is saved.',
  },
];

export const serviceDescriptions: Record<ServiceCategory, string> = {
  Electrical: 'Wiring, sockets, lighting and power faults.',
  Plumbing: 'Leaks, blocked drains, taps and water heaters.',
  HVAC: 'Air conditioning, heating and ventilation.',
  'Appliance Repair': 'Fridges, washing machines, cookers and more.',
  'Car & Garage': 'Engine, brakes, batteries and servicing.',
  'Truck & Mechanical': 'Heavy vehicles and mechanical equipment.',
  'Home Repair': 'Doors, walls, roofing, painting and carpentry.',
  'General Maintenance': 'Everyday fixes and upkeep around your property.',
};

export const customerBenefits: Feature[] = [
  {
    icon: PhoneOff,
    title: 'No more calling around',
    description: 'One request reaches qualified technicians who are free right now.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified technicians',
    description: 'Every fundi is checked before they can take jobs, and rated after every one.',
  },
  {
    icon: Receipt,
    title: 'Know the visit fee upfront',
    description: 'See the diagnostic visit fee before you request. No surprises at the door.',
  },
  {
    icon: ShieldCheck,
    title: 'You approve every charge',
    description: 'Repairs start only after you approve the quote, and extra work needs your approval too.',
  },
  {
    icon: MapPin,
    title: 'Track your technician',
    description: 'Follow each step, from on the way to arrived, diagnosing and done.',
  },
  {
    icon: FileText,
    title: 'A record of every repair',
    description: 'Diagnosis, parts, labour and payment are saved for every job you book.',
  },
];

export const technicianBenefits: Feature[] = [
  {
    icon: Power,
    title: 'Work when you want',
    description: 'Go LIVE when you are ready for jobs and OFFLINE when you are not.',
  },
  {
    icon: Wrench,
    title: 'Jobs that match your trade',
    description: 'Offers are based on your skills, service area, location and current workload.',
  },
  {
    icon: BellRing,
    title: 'See the job before you accept',
    description: 'Review the problem, photos, location and visit fee, then accept or decline.',
  },
  {
    icon: Wallet,
    title: 'Get paid for every visit',
    description: 'Earn your share of the visit fee, plus the repair work the customer approves.',
  },
  {
    icon: Star,
    title: 'Build your reputation',
    description: 'Good ratings help you get matched with more customers.',
  },
  {
    icon: CalendarCheck,
    title: 'Track your earnings',
    description: 'Your job history and earnings are always in one place.',
  },
];

export const faqs = [
  {
    question: 'How does Fundi choose a technician?',
    answer:
      'Fundi looks at who has the right skill, who is available now, who can reach you soonest, their rating and history, and whether they are already busy with another job.',
  },
  {
    question: 'What is the visit fee?',
    answer:
      'It is a fixed fee for a technician to come and diagnose the problem. You see it before you send your request, and you pay it through Fundi.',
  },
  {
    question: 'Will I be charged for work I did not approve?',
    answer:
      'No. After the diagnosis you get a quote with parts and labour. The repair only starts once you approve it, and any additional work needs your approval as well.',
  },
  {
    question: 'How do I pay for the repair?',
    answer:
      'You can pay through Fundi, in cash, by mobile money or another method you agree with the technician. Fundi records how the repair was settled either way.',
  },
  {
    question: 'How do I become a Fundi technician?',
    answer:
      'Download the app, choose your trade and submit your documents. Once your profile is verified you can go LIVE and start receiving jobs.',
  },
  {
    question: 'Where is Fundi available?',
    answer:
      'Fundi is launching in selected cities first. Download the app to see whether technicians are available near you.',
  },
];
