"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, CheckCircle2 } from "lucide-react";
import WacSelect from "@/components/ui/WacSelect";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In a real implementation this would post to a Supabase table or Email service.
    // Given the beta nature, simulating success for now.
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl wac-card p-8 sm:p-12">
        <h1 className="text-4xl font-serif tracking-tight font-bold mb-4 text-[var(--accent)]">
          Contact Us
        </h1>
        <p className="text-white/60 mb-10 leading-relaxed">
          Have a question, feedback, or need assistance? Fill out the form below
          and our team will get back to you shortly.
        </p>

        {submitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Message Sent</h2>
            <p className="text-white/60 mb-8 max-w-sm">
              Thank you for reaching out! We've received your message and will respond to the email provided within 24-48 hours.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 rounded-full border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/50 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/50 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Reason for Contact
              </label>
              <WacSelect
                value={reason}
                onChange={setReason}
                placeholder="Select a topic..."
                options={[
                  { value: "support", label: "Technical Support" },
                  { value: "feedback", label: "Beta Feedback" },
                  { value: "partnership", label: "Partnership Inquiry" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Message
              </label>
              <textarea
                required
                rows={5}
                placeholder="How can we help you?"
                className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/50 transition-all outline-none resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--accent)] hover:brightness-110 text-white font-bold rounded-xl transition-all"
            >
              <Send size={16} />
              Send Message
            </button>
          </form>
        )}

        <div className="border-t border-[var(--border)] pt-8 mt-12">
          <Link
            href="/"
            className="inline-flex items-center text-[var(--accent)] hover:opacity-80 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
