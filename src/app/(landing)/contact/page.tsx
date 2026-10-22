"use client";

import { useState, type FormEvent } from "react";
import { Mail, MapPin, Phone, Send, UserCheck, MessageSquare, Briefcase } from "lucide-react";

type InquiryType = "general" | "support" | "business";

export default function ContactPage() {
  const [inquiryType, setInquiryType] = useState<InquiryType>("general");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const categoryLabel = 
      inquiryType === "support" ? "[Technical Support]" : 
      inquiryType === "business" ? "[Business & Partnerships]" : 
      "[General Customer Inquiry]";

    const rawSubject = String(formData.get("subject") ?? "");
    const subject = `${categoryLabel} ${rawSubject}`.trim();

    const body = [
      `Inquiry Category: ${inquiryType.toUpperCase()}`,
      `Client Name: ${formData.get("name") ?? ""}`,
      `Phone/Contact: ${formData.get("number") ?? ""}`,
      `Email Address: ${formData.get("email") ?? ""}`,
      "",
      "--- Message Details ---",
      String(formData.get("message") ?? ""),
    ].join("\n");

    window.location.href = `mailto:support@fundi.rw?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <section className="bg-slate-100/70 px-4 pt-6 pb-16 sm:px-6 sm:pt-8 sm:pb-20">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            How can we help you today?
          </h1>
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-600 max-w-xl mx-auto">
            Whether you&apos;re an existing client needing assistance or a new customer exploring Fundi, our team is ready to support you.
          </p>
        </div>

        {/* Main Card Container */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl ring-1 ring-slate-900/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Inquiry Category Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                Select topic <span className="text-amber-600">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setInquiryType("general")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-semibold transition-all ${
                    inquiryType === "general"
                      ? "border-amber-500 bg-amber-500 text-white shadow-md"
                      : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <MessageSquare className={`h-4 w-4 ${inquiryType === "general" ? "text-white" : "text-amber-600"}`} />
                  General Inquiry
                </button>

                <button
                  type="button"
                  onClick={() => setInquiryType("support")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-semibold transition-all ${
                    inquiryType === "support"
                      ? "border-amber-500 bg-amber-500 text-white shadow-md"
                      : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <UserCheck className={`h-4 w-4 ${inquiryType === "support" ? "text-white" : "text-amber-600"}`} />
                  Client Support
                </button>

                <button
                  type="button"
                  onClick={() => setInquiryType("business")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-semibold transition-all ${
                    inquiryType === "business"
                      ? "border-amber-500 bg-amber-500 text-white shadow-md"
                      : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <Briefcase className={`h-4 w-4 ${inquiryType === "business" ? "text-white" : "text-amber-600"}`} />
                  Technician
                </button>
              </div>
            </div>

            {/* Client Info Grid */}
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Full Name <span className="text-amber-600">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Your Name"
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/15"
                />
              </div>

              <div>
                <label htmlFor="number" className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Phone Number <span className="text-amber-600">*</span>
                </label>
                <input
                  id="number"
                  name="number"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="078 000 0000"
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/15"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="client@domain.com"
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/15"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                Subject <span className="text-amber-600">*</span>
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                placeholder="Brief summary of your request"
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/15"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                Message <span className="text-amber-600">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                placeholder="Tell us more about how we can help..."
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/15 resize-y"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="group relative flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3.5 px-8 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:from-amber-600 hover:to-orange-700 hover:shadow-amber-500/35 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Send Request
                <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </form>

          {/* Quick Contact Cards */}
          <div className="mt-10 border-t border-slate-200 pt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <a
              href="mailto:support@fundi.rw"
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 transition-all duration-200 hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Us</span>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">support@fundi.rw</span>
              </div>
            </a>

            <a
              href="tel:+250788123456"
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-50/50 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Call Us</span>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">+250 788 123 456</span>
              </div>
            </a>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Office</span>
                <span className="text-xs font-semibold text-slate-800">Kigali, Rwanda</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}