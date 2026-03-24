import Link from "next/link";
import { Mail, Search, BookOpen, MessageCircle } from "lucide-react";

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl wac-card p-8 sm:p-12">
        <h1 className="text-4xl font-serif tracking-tight font-bold mb-8 text-[var(--accent)]">
          Help &amp; Support
        </h1>

        <p className="text-white/70 mb-10 leading-relaxed text-lg">
          Welcome to the World Albanian Congress support center. How can we assist you today?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {/* Box 1 */}
          <Link href="/contact" className="flex flex-col gap-3 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] mb-2">
              <Mail size={18} />
            </div>
            <h3 className="text-lg font-bold text-white">Contact Support</h3>
            <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">
              Send us a direct message and our team will get back to you as soon as possible.
            </p>
          </Link>

          {/* Box 2 */}
          <Link href="/directory" className="flex flex-col gap-3 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
            <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 mb-2">
              <Search size={18} />
            </div>
            <h3 className="text-lg font-bold text-white">Using the Directory</h3>
            <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">
              Learn how to connect, search, and discover other members of the diaspora.
            </p>
          </Link>

          {/* Box 3 */}
          <div className="flex flex-col gap-3 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] opacity-60">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2">
              <BookOpen size={18} />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">User Guide</h3>
              <span className="text-[10px] uppercase tracking-wider text-white/40 border border-white/[0.1] px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              Comprehensive walkthroughs of all platform features.
            </p>
          </div>

          {/* Box 4 */}
          <div className="flex flex-col gap-3 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] opacity-60">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
              <MessageCircle size={18} />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Community FAQs</h3>
              <span className="text-[10px] uppercase tracking-wider text-white/40 border border-white/[0.1] px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              Answers to the most common questions from our members.
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-8">
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
