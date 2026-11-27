"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  createAdminCompany,
  deleteAdminCompany,
  listAdminCompanies,
  updateAdminCompany,
  updateAdminCompanyVerification,
} from "@/lib/api/companies";
import type {
  Company,
  CompanyVerificationStatus,
} from "@/types/company";

const STATUS_FILTERS: Array<{ label: string; value?: CompanyVerificationStatus }> = [
  { label: "All", value: undefined },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

function StatusBadge({ status }: { status: CompanyVerificationStatus }) {
  const styles: Record<CompanyVerificationStatus, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

interface CompanyModalProps {
  open: boolean;
  editingCompany: Company | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

function CompanyModal({
  open,
  editingCompany,
  onClose,
  onSaved,
}: CompanyModalProps) {
  const [technicianId, setTechnicianId] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (editingCompany) {
      setTechnicianId(editingCompany.technicianId);
      setName(editingCompany.name);
      setLocation(editingCompany.location);
      setEmail(editingCompany.email);
      setPhoneNumber(editingCompany.phoneNumber);
      setDescription(editingCompany.description ?? "");
    } else {
      setTechnicianId("");
      setName("");
      setLocation("Kigali, Rwanda");
      setEmail("");
      setPhoneNumber("+250");
      setDescription("");
    }
  }, [open, editingCompany]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingCompany) {
        await updateAdminCompany(editingCompany.id, {
          name: name.trim(),
          location: location.trim(),
          email: email.trim().toLowerCase(),
          phoneNumber: phoneNumber.trim(),
          description: description.trim() ? description.trim() : null,
        });
      } else {
        await createAdminCompany({
          technicianId: technicianId.trim(),
          name: name.trim(),
          location: location.trim(),
          email: email.trim().toLowerCase(),
          phoneNumber: phoneNumber.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
        });
      }

      await onSaved();
      onClose();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save company details.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingCompany ? `Edit ${editingCompany.name}` : "Register Company for Technician"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {formError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingCompany && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Technician Profile ID (UUID)
              </label>
              <input
                type="text"
                required
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                placeholder="e5a4f4d7-0b21-46d8-9a4b-98765d332100"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Company Name
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={160}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Amina Plumbing Ltd"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Location
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={255}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Kigali, Rwanda"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Email
              </label>
              <input
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="company@example.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Phone Number (+250...)
              </label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+250788123456"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Residential and commercial services..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : editingCompany
                  ? "Save changes"
                  : "Create company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CompaniesView() {
  const [statusFilter, setStatusFilter] = useState<
    CompanyVerificationStatus | undefined
  >(undefined);
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listAdminCompanies(statusFilter);
      setCompanies(items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load companies.",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => {
      const ownerName = c.technician?.user?.fullName?.toLowerCase() ?? "";
      return (
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phoneNumber.toLowerCase().includes(q) ||
        ownerName.includes(q)
      );
    });
  }, [companies, search]);

  async function handleVerificationChange(
    companyId: string,
    verificationStatus: CompanyVerificationStatus,
  ) {
    setBusyId(companyId);
    setError(null);
    try {
      await updateAdminCompanyVerification(companyId, verificationStatus);
      await loadCompanies();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update verification status.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(company: Company) {
    const confirmed = window.confirm(
      `Delete "${company.name}"? This will reset the technician's business type back to INDIVIDUAL.`,
    );
    if (!confirmed) return;

    setBusyId(company.id);
    setError(null);
    try {
      await deleteAdminCompany(company.id);
      await loadCompanies();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete company.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-500">
            Review, verify, and manage technician companies across the platform.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCompany(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          New company
        </button>
      </div>

      {/* Status Filter Chips & Search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((item) => {
            const active = statusFilter === item.value;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setStatusFilter(item.value)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, owner, phone, email..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading companies...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <Building2 className="mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">
              No companies found
            </p>
            <p className="text-xs text-slate-500">
              Try changing the verification filter or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Technician Owner</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompanies.map((company) => {
                  const isBusy = busyId === company.id;
                  return (
                    <tr key={company.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 align-top">
                        <p className="font-semibold text-slate-900">
                          {company.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {company.location}
                        </p>
                        {company.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                            {company.description}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <p className="font-medium text-slate-800">
                          {company.technician?.user?.fullName ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {company.technician?.user?.phoneNumber ??
                            company.technicianId}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 align-top text-xs text-slate-600">
                        <p>{company.email}</p>
                        <p>{company.phoneNumber}</p>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <StatusBadge status={company.verificationStatus} />
                      </td>

                      <td className="px-4 py-3.5 align-top text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {company.verificationStatus !== "APPROVED" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void handleVerificationChange(
                                  company.id,
                                  "APPROVED",
                                )
                              }
                              title="Approve company"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approve
                            </button>
                          )}

                          {company.verificationStatus !== "REJECTED" && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void handleVerificationChange(
                                  company.id,
                                  "REJECTED",
                                )
                              }
                              title="Reject company"
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => {
                              setEditingCompany(company);
                              setModalOpen(true);
                            }}
                            title="Edit company"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleDelete(company)}
                            title="Delete company"
                            className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CompanyModal
        open={modalOpen}
        editingCompany={editingCompany}
        onClose={() => setModalOpen(false)}
        onSaved={loadCompanies}
      />
    </div>
  );
}