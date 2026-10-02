"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Database,
  ServerCog,
  ShieldCheck,
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";

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
      const res = await fetchApi<HealthData>("/health");
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 shadow-xl shadow-slate-200/60">
        <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.3fr_0.7fr] md:px-10 md:py-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-200">
              <Activity size={14} /> Fundi Platform
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-5xl">
              Platform Overview
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
              System initialization and developer dashboard for managing backend
              services, mobile apps, and technician operations across the Fundi
              ecosystem.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Admin Login <ArrowRight size={16} />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <ShieldCheck size={16} className="text-emerald-400" />
                Secure access enabled
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              Live Status
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">API</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${health?.services.api === "up" ? "bg-emerald-400" : "bg-amber-400"}`}
                  />
                </div>
                <p className="mt-3 text-2xl font-bold text-white">
                  {health?.services.api || "Unknown"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Database</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${health?.services.database === "up" ? "bg-emerald-400" : "bg-slate-400"}`}
                  />
                </div>
                <p className="mt-3 text-2xl font-bold text-white">
                  {health?.services.database || "Not Connected"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <ServerCog size={20} />
          </div>
          <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Backend Service
          </h3>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${health?.services.api === "up" ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            <span className="text-2xl font-bold text-slate-900">
              {health?.services.api || "Unknown"}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            NestJS API Server Status
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Database size={20} />
          </div>
          <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Database Service
          </h3>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${health?.services.database === "up" ? "bg-emerald-500" : "bg-slate-400"}`}
            />
            <span className="text-2xl font-bold text-slate-900">
              {health?.services.database || "Not Connected"}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            PostgreSQL + PostGIS Extension
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Activity size={20} />
          </div>
          <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Cache & Queue Service
          </h3>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${health?.services.redis === "up" ? "bg-emerald-500" : "bg-slate-400"}`}
            />
            <span className="text-2xl font-bold text-slate-900">
              {health?.services.redis || "Not Connected"}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Redis + BullMQ Infrastructure
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Platform Infrastructure Setup
        </h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500 animate-pulse">
            Querying backend API health...
          </p>
        ) : error ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">Backend API Notice:</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-xs text-amber-600">
              Ensure the backend server is running before checking live metrics.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>
              <strong className="text-slate-900">Overall System Health:</strong>{" "}
              {health?.status}
            </p>
            <p>
              <strong className="text-slate-900">Last Verified:</strong>{" "}
              {health?.timestamp}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
