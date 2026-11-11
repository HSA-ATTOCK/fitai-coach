
"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { MailCheck, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("athlete@example.com");
const [name, setName] = useState("");

useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  const registeredEmail = params.get("email");
  const registeredName = params.get("name");

  if (registeredEmail) {
    setEmail(registeredEmail);
  }

  if (registeredName) {
    setName(registeredName);
  }
}, []);

  function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(code)) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    // Demo-only verification. No real email or OTP service is connected.
    if (code !== "123456") {
      setError("Invalid demo code. Please use 123456.");
      return;
    }

    setVerified(true);
  }

  return (
    <AuthShell>
      <div className="mx-auto flex w-full max-w-[480px] flex-col justify-center py-8">
        <section className="rounded-2xl border border-[#424935] bg-[#1a1c1b] p-6 shadow-2xl sm:p-8">
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#b0f734]/20 bg-[#b0f734]/10 text-[#b0f734]">
            {verified ? <ShieldCheck size={28} /> : <MailCheck size={28} />}
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#96da06]">
            Email verification
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {verified
  ? "Email Verified!"
  : name
    ? `Welcome, ${name}!`
    : "Check Your Email"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#a4ada5]">
            {verified
              ? "Your demo email verification is complete. You can continue to the login page."
              : "We've prepared a demo verification step. Enter the 6-digit code below to continue."}
          </p>

          {!verified && (
            <>
              <div className="mt-6 rounded-xl border border-[#424935] bg-[#121413] p-4">
                <p className="text-xs text-[#737d73]">Verification email</p>
                <p className="mt-1 break-all text-sm font-semibold text-white">
  {email}
</p>
              </div>

              <form onSubmit={handleVerify} className="mt-7 space-y-5">
                <div>
                  <label htmlFor="otp" className="mb-3 block text-sm font-medium text-white">
                    Enter verification code
                  </label>

                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    className="w-full rounded-xl border border-[#424935] bg-[#121413] px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-[#b0f734] outline-none transition placeholder:text-[#424935] focus:border-[#b0f734] focus:ring-2 focus:ring-[#b0f734]/20"
                  />

                  <p className="mt-2 text-[10px] text-[#737d73]">
                    Demo verification code: 123456
                  </p>
                </div>

                {error && (
                  <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#b0f734] px-5 py-3.5 text-sm font-bold text-[#121413] transition hover:bg-[#96da06]"
                >
                  Verify Email
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setCode("");
                  setError("");
                  alert("Demo only: a real verification email is not sent.");
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 text-xs font-semibold text-[#b0f734] hover:underline"
              >
                <RefreshCw size={14} />
                Resend verification code
              </button>
            </>
          )}

          {verified && (
            <Link
              href="/login"
              className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#b0f734] px-5 py-3.5 text-sm font-bold text-[#121413] transition hover:bg-[#96da06]"
            >
              Continue to Login
            </Link>
          )}

          <Link
            href="/signup"
            className="mt-7 flex items-center justify-center gap-2 text-sm text-[#a4ada5] transition hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to Sign Up
          </Link>
        </section>

        <p className="mt-5 text-center text-[10px] uppercase tracking-wider text-[#737d73]">
          Demo Mode · Email delivery not connected
        </p>
      </div>
    </AuthShell>
  );
}
