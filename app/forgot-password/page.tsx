
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error: recoveryError } =
      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

    setLoading(false);

    if (recoveryError) {
      setError(recoveryError.message);
      return;
    }

    setSubmitted(true);
  }

  return (
    <AuthShell>
      <div className="mx-auto flex min-h-[calc(100vh-130px)] max-w-5xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-[480px]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#B7FF3C]/20 bg-[#B7FF3C]/10">
              <LockKeyhole className="h-8 w-8 text-[#B7FF3C]" />
            </div>

            <p className="mb-3 font-mono text-xs tracking-[0.25em] text-[#B7FF3C]">
              ACCOUNT RECOVERY PROTOCOL
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-white">
              Forgot Password?
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              Enter the email address associated with your account.
              We&apos;ll send you a password recovery link.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#171B18] p-6 shadow-2xl sm:p-8">
            {!submitted ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Email Address
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />

                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-white/10 bg-[#101311] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#B7FF3C]"
                      />
                    </div>

                    {error && (
                      <p role="alert" className="mt-2 text-sm text-red-400">
                        {error}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#B7FF3C] py-3.5 text-sm font-bold text-black transition hover:bg-[#a6ed2e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Recovery Link"}
                  </button>
                </form>

                <div className="mt-7 border-t border-white/10 pt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-[#B7FF3C]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-4 text-center">
                <CheckCircle2 className="mx-auto mb-5 h-14 w-14 text-[#B7FF3C]" />

                <h2 className="text-xl font-bold text-white">
                  Check Your Email
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-400">
                  If an account exists for{" "}
                  <span className="font-medium text-white">{email}</span>,
                  you&apos;ll receive a password recovery link.
                </p>

                <div className="mt-6 rounded-xl border border-[#B7FF3C]/20 bg-[#B7FF3C]/5 p-4 text-left">
                  <p className="text-xs font-bold tracking-wider text-[#B7FF3C]">
                    NEXT STEP
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    Open the recovery email and click its link. You&apos;ll be
                    redirected to FitAI Coach to create a new password.
                    Check your spam folder if necessary.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setError("");
                  }}
                  className="mt-5 text-sm font-medium text-[#B7FF3C] hover:underline"
                >
                  Try another email
                </button>

                <Link
                  href="/login"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#B7FF3C] py-3.5 text-sm font-bold text-black transition hover:bg-[#a6ed2e]"
                >
                  Return to Login
                </Link>
              </div>
            )}
          </div>

          <p className="mt-6 text-center font-mono text-[10px] tracking-widest text-gray-600">
            FITAI COACH • SECURE AUTHENTICATION
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
