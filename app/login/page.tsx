"use client";

import { supabase } from "@/lib/supabase";
import { useState, FormEvent } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleGoogleLogin() {
    setIsLoadingGoogle(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsLoadingEmail(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoadingEmail(false);
    } else {
      setEmailSent(true);
      setErrorMsg(""); // Clear errors on success
      setIsLoadingEmail(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-center">
        <div className="flex h-16 w-16 mx-auto mb-6 items-center justify-center overflow-hidden rounded-full border-2 border-[#b08d57]/60 bg-[var(--accent)] shadow-[0_0_20px_rgba(176,141,87,0.3)]">
          <img
            src="/images/wac-logo.jpg"
            alt="World Albanian Congress Logo"
            className="h-full w-full object-cover scale-[1.4] mix-blend-multiply opacity-95"
          />
        </div>

        <h1 className="text-3xl font-serif tracking-tight font-bold mb-2">
          Join the Network
        </h1>
        <p className="text-sm opacity-70 mb-8 leading-relaxed">
          Create your profile or sign in to connect with the global Albanian
          diaspora.
        </p>

        {emailSent ? (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
            <h3 className="font-bold mb-1">Check your email</h3>
            <p className="text-sm opacity-90">
              We sent a magic link to <strong>{email}</strong>. Click it to
              securely sign in.
            </p>
            <button
              onClick={() => setEmailSent(false)}
              className="mt-4 text-xs underline opacity-70 hover:opacity-100"
            >
              Try another email
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoadingGoogle || isLoadingEmail}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 mb-6"
            >
              {isLoadingGoogle ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--foreground)]/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#1A1A1A] px-2 text-[var(--foreground)]/50">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-transparent"
              />
              {errorMsg && (
                <p className="text-red-400 text-xs text-left">{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={isLoadingEmail || isLoadingGoogle || !email}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {isLoadingEmail ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : null}
                Send Magic Link
              </button>
              <div className="text-left mt-2 px-1">
                <p className="text-[10px] sm:text-xs opacity-50 leading-tight">
                  <span className="font-semibold text-[var(--accent)]">
                    What's a Magic Link?
                  </span>{" "}
                  No passwords needed. We'll send a secure, one-time link to
                  your inbox. Just click it to sign in instantly.
                </p>
              </div>
            </form>
          </>
        )}

        <p className="text-xs opacity-50 mt-6 pt-4 border-t border-[var(--foreground)]/10">
          By joining, you agree to our{" "}
          <Link
            href="/terms"
            className="underline hover:opacity-100 transition text-[var(--foreground)]"
          >
            Terms of Service
          </Link>{" "}
          and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
