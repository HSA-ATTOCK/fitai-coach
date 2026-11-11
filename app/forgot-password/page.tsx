
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LockKeyhole, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
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
              We'll show you a simulated recovery confirmation.
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-white/10 bg-[#101311] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#B7FF3C]"
                      />
                    </div>

                    {error && (
                      <p className="mt-2 text-sm text-red-400">{error}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#B7FF3C] py-3.5 text-sm font-bold text-black transition hover:bg-[#a6ed2e]"
                  >
                    Send Recovery Link
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
                  Recovery Request Submitted
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-400">
                  Your demo recovery request for{" "}
                  <span className="font-medium text-white">{email}</span>{" "}
                  has been accepted.
                </p>

                <div className="mt-6 rounded-xl border border-[#B7FF3C]/20 bg-[#B7FF3C]/5 p-4 text-left">
                  <p className="text-xs font-bold tracking-wider text-[#B7FF3C]">
                    DEMO MODE NOTICE
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    No recovery email has been sent. Real password recovery
                    will be connected during the backend integration phase.
                  </p>
                </div>

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
            FITAI COACH • PHASE 2 AUTHENTICATION SANDBOX
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
