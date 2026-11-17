
"use client";

import { useState, type FormEvent } from "react";

import Link from "next/link";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
  }

  return (
    <AuthShell>
      <main className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-[#121413] px-4 py-12 text-[#e2e3e0]">
        <div className="w-full max-w-md">
          <section className="rounded-2xl border border-[#424935] bg-[#1a1c1b] p-6 shadow-2xl sm:p-8">
            <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#b0f734]/20 bg-[#b0f734]/10 text-[#b0f734]">
              {success ? (
                <CheckCircle2 size={28} />
              ) : (
                <LockKeyhole size={28} />
              )}
            </div>

            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#96da06]">
              Account Security
            </p>

            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {success ? "Password Updated!" : "Create New Password"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#a4ada5]">
              {success
                ? "Your password has been successfully updated. You can now sign in using your new password."
                : "Choose a strong new password for your FitAI Coach account."}
            </p>

            {!success ? (
              <form
                onSubmit={handleResetPassword}
                className="mt-7 space-y-5"
              >
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-white"
                  >
                    New Password
                  </label>

                  <div className="flex rounded-xl border border-[#424935] bg-[#121413] focus-within:border-[#b0f734]">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter new password"
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="px-4 text-[#96da06]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-[#737d73]">
                    Minimum 8 characters.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-white"
                  >
                    Confirm New Password
                  </label>

                  <div className="flex rounded-xl border border-[#424935] bg-[#121413] focus-within:border-[#b0f734]">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Confirm new password"
                      className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      className="px-4 text-[#96da06]"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs leading-5 text-red-300"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#b0f734] px-5 py-3.5 text-sm font-bold text-[#121413] transition hover:bg-[#96da06] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Updating Password..." : "Update Password"}
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#b0f734] px-5 py-3.5 text-sm font-bold text-[#121413] transition hover:bg-[#96da06]"
              >
                Continue to Login
              </Link>
            )}

            {!success && (
              <Link
                href="/login"
                className="mt-7 flex items-center justify-center gap-2 text-sm text-[#a4ada5] transition hover:text-white"
              >
                <ArrowLeft size={15} />
                Back to Login
              </Link>
            )}
          </section>

          <p className="mt-5 text-center text-[10px] uppercase tracking-wider text-[#737d73]">
            Secure Authentication · Supabase
          </p>
        </div>
      </main>
    </AuthShell>
  );
}
