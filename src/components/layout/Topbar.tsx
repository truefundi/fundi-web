import { Bell, Menu } from 'lucide-react';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-3">
        <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        {/* Placeholder until authentication is wired up */}
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
            AD
          </span>
          <span className="hidden text-sm font-medium text-slate-700 sm:block">Admin</span>
        </div>
      </div>
    </header>
  );
}
