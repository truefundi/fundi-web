'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api-client';

interface HealthData {
  status: string;
  timestamp: string;
  services: {
    api: string;
    database: string;
    redis: string;
  };
}

export default function HomePage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkHealth() {
      setLoading(true);
      const res = await fetchApi<HealthData>('/health');
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setHealth(res.data);
      }
      setLoading(false);
    }
    checkHealth();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Fundi Platform Overview</h1>
        <p className="text-slate-600 mt-1">
          System initialization & developer dashboard for managing backend services, mobile apps, and technicians.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Backend Service</h3>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`h-3 w-3 rounded-full ${health?.services.api === 'up' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span className="text-2xl font-bold text-slate-900">{health?.services.api || 'Unknown'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">NestJS API Server Status</p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Database Service</h3>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`h-3 w-3 rounded-full ${health?.services.database === 'up' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            <span className="text-2xl font-bold text-slate-900">{health?.services.database || 'Not Connected'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">PostgreSQL + PostGIS Extension</p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Cache & Queue Service</h3>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`h-3 w-3 rounded-full ${health?.services.redis === 'up' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            <span className="text-2xl font-bold text-slate-900">{health?.services.redis || 'Not Connected'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Redis + BullMQ Infrastructure</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Platform Infrastructure Setup</h2>
        {loading ? (
          <p className="text-slate-500 text-sm animate-pulse">Querying backend API health...</p>
        ) : error ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <p className="font-semibold">Backend API Notice:</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-xs text-amber-600">Ensure backend server is running on localhost:3000 to enable live metrics.</p>
          </div>
        ) : (
          <div className="text-sm text-slate-600 space-y-2">
            <p><strong className="text-slate-900">Overall System Health:</strong> {health?.status}</p>
            <p><strong className="text-slate-900">Last Verified:</strong> {health?.timestamp}</p>
          </div>
        )}
      </div>
    </div>
  );
}
