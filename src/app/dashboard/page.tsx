"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="font-bold">Fundi Admin Dashboard</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600">{user?.email}</span>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        <h2 className="text-2xl font-bold">Welcome, {user?.email} </h2>
        <p className="mt-2 text-slate-600">
          You are signed in as an administrator.
        </p>
      </main>
    </div>
  );
}
