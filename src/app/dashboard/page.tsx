import { redirect } from 'next/navigation';

/** The admin dashboard lives at /admin; keep /dashboard working for old links. */
export default function DashboardRedirect() {
  redirect('/admin');
}
