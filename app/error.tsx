"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Route Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center px-4 py-20">
      <div className="wac-card p-8 sm:p-12 max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        
        <h1 className="text-2xl font-serif font-bold text-white mb-3">
          Something went wrong
        </h1>
        
        <p className="text-sm text-white/50 mb-8 leading-relaxed">
          {error.message || "We encountered an unexpected error while loading this component. Our team has been notified."}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--accent)] text-black font-bold rounded-xl hover:brightness-110 transition-all"
          >
            <RotateCcw size={16} />
            Try Again
          </button>
          
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-medium rounded-xl transition-all"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
