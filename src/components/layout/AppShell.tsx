'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { env } from '@/config/env';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {env.appName}. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
