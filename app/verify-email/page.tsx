
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";
import {
  MailCheck,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const name = searchParams.get("name") || "";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleResendEmail() {
    if (!email) {
      setError("Email address is missing. Please sign up again.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    setLoading(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setMessage("Confirmation email request submitted. Please check your inbox and spam folder.");
  }

  return (
    <AuthShell>
      <div className="mx-auto flex w-full max-w-[480px] flex-col justify-center py-8">
        <section className="rounded-2xl border border-[#424935] bg-[#1a1c1b] p-6 shadow-2xl sm:p-8">
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#b0f734]/20 bg-[#b0f734]/10 text-[#b0f734]">
            <MailCheck size={28} />
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#96da06]">
            Email verification
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {name ? `Welcome, ${name}!` : "Check Your Email"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#a4ada5]">
            Your account has been created. We&apos;ve requested an email
            confirmation link. Open the link in your email to verify your
            address and access your FitAI Coach dashboard.
          </p>

          <div className="mt-6 rounded-xl border border-[#424935] bg-[#121413] p-4">
            <p className="text-xs text-[#737d73]">
              Confirmation email address
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-white">
              {email || "Email address unavailable"}
            </p>
          </div>

          {message && (
            <p
              role="status"
              className="mt-5 rounded-lg border border-[#b0f734]/30 bg-[#b0f734]/10 p-3 text-xs text-[#b0f734]"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
            >
              {error}
            </p>
          )}

          <div className="mt-7 space-y-4">
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={loading || !email}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b0f734] px-5 py-3.5 text-sm font-bold text-[#121413] transition hover:bg-[#96da06] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              {loading ? "Sending..." : "Resend Confirmation Email"}
            </button>

            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl border border-[#424935] px-5 py-3.5 text-sm font-semibold text-white transition hover:border-[#b0f734] hover:text-[#b0f734]"
            >
              Continue to Login
            </Link>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#121413] p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#b0f734]" />
            <p className="text-xs leading-5 text-[#737d73]">
              If you don&apos;t see the email, check your spam folder. The
              confirmation link will take you back to FitAI Coach.
            </p>
          </div>

          <Link
            href="/signup"
            className="mt-7 flex items-center justify-center gap-2 text-sm text-[#a4ada5] transition hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to Sign Up
          </Link>
        </section>

        <p className="mt-5 text-center text-[10px] uppercase tracking-wider text-[#737d73]">
          Secure Authentication · Supabase
        </p>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0e0c]" />
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
