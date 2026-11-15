
"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell>
      <main className="relative flex min-h-[calc(100vh-10rem)] items-center justify-center overflow-hidden bg-[#121413] px-4 py-12 text-[#e2e3e0]">
        <div className="w-full max-w-md">
          <section className="rounded-2xl border border-[#424935] bg-[#1a1c1b] p-6 shadow-xl sm:p-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#96da06]">
              Welcome back
            </p>

            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm text-[#a4ada5]">
              Sign in to continue your fitness journey.
            </p>

            <button
              type="button"
              onClick={() =>
                setError(
                  "Google sign-in is not configured yet. Please use email and password."
                )
              }
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-[#424935] bg-[#121413] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#b0f734]"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285F4]">
                G
              </span>
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#424935]" />
              <span className="text-[10px] uppercase tracking-widest text-[#737d73]">
                Or continue with email
              </span>
              <div className="h-px flex-1 bg-[#424935]" />
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#424935] bg-[#121413] px-4 py-3 text-sm outline-none transition focus:border-[#b0f734] focus:ring-2 focus:ring-[#b0f734]/20"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#b0f734] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="flex rounded-xl border border-[#424935] bg-[#121413] focus-within:border-[#b0f734]">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="px-4 text-xs font-semibold text-[#96da06]"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
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

              {searchParams.get("error") === "auth_callback_failed" && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs leading-5 text-red-300"
                >
                  Email confirmation failed or the link has expired. Please
                  try again or request a new confirmation email.
                </p>
              )}

              <label className="flex items-center gap-2 text-sm text-[#a4ada5]">
                <input
                  type="checkbox"
                  className="accent-[#b0f734]"
                />
                Remember me
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#b0f734] px-5 py-3.5 text-sm font-bold text-[#121413] transition hover:bg-[#96da06] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-[#a4ada5]">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-bold text-[#b0f734] hover:underline"
              >
                Create account
              </Link>
            </p>
          </section>

          <div className="mt-6 rounded-xl border border-[#b0f734]/20 bg-[#b0f734]/5 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#b0f734]/10 text-[#b0f734]">
                <span className="text-lg">ⓘ</span>
              </span>

              <div>
                <p className="text-xs font-bold text-[#b0f734]">
                  Secure Authentication
                </p>
                <p className="mt-1 text-xs leading-5 text-[#a4ada5]">
                  Your account is authenticated securely through Supabase.
                  Use the email and password you registered with.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] uppercase tracking-wider text-[#737d73]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#b0f734]" />
              Authentication Online
            </span>
            <span>Supabase</span>
            <span>Version 3.0.0</span>
          </div>
        </div>
      </main>
    </AuthShell>
    );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
