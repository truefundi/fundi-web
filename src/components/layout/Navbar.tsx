import React from 'react';
import Link from 'next/link';

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            F
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">
            Fundi <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Admin</span>
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <Link href="#services" className="hover:text-blue-600 transition-colors">
            Services
          </Link>
          <Link href="#technicians" className="hover:text-blue-600 transition-colors">
            Technicians
          </Link>
          <Link href="#jobs" className="hover:text-blue-600 transition-colors">
            Jobs
          </Link>
        </nav>
      </div>
    </header>
  );
}
