
"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, UserRound, Mail, Lock } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the terms and conditions.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      if (!data.user) {
        setError("Registration could not be completed. Please try again.");
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      router.push(
        `/verify-email?email=${encodeURIComponent(email.trim())}&name=${encodeURIComponent(name.trim())}`
      );
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="mx-auto flex w-full max-w-[480px] flex-col justify-center py-4">
        <section className="rounded-2xl border border-[#424935] bg-[#1a1c1b] p-6 shadow-2xl sm:p-8">
          <div className="mb-7">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#96da06]">
              Join the protocol
            </p>

            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Create Account
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#a4ada5]">
              Start your fitness journey with FitAI Coach.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setError("Google sign-up is not configured yet. Please register using email.")
            }
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#424935] bg-[#121413] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#b0f734]"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white font-bold text-[#4285F4]">
              G
            </span>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#424935]" />
            <span className="text-[10px] uppercase tracking-widest text-[#737d73]">
              Or register with email
            </span>
            <div className="h-px flex-1 bg-[#424935]" />
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-white">
                Full name
              </label>

              <div className="flex items-center rounded-xl border border-[#424935] bg-[#121413] px-4 focus-within:border-[#b0f734]">
                <UserRound size={17} className="text-[#737d73]" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-[#737d73]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-white">
                Email address
              </label>

              <div className="flex items-center rounded-xl border border-[#424935] bg-[#121413] px-4 focus-within:border-[#b0f734]">
                <Mail size={17} className="text-[#737d73]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-[#737d73]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-white">
                Password
              </label>

              <div className="flex items-center rounded-xl border border-[#424935] bg-[#121413] px-4 focus-within:border-[#b0f734]">
                <Lock size={17} className="text-[#737d73]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  className="w-full min-w-0 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-[#737d73]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-[#96da06]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <p className="mt-2 text-[10px] text-[#737d73]">
                Use at least 8 characters.
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-white">
                Confirm password
              </label>

              <div className="flex items-center rounded-xl border border-[#424935] bg-[#121413] px-4 focus-within:border-[#b0f734]">
                <Lock size={17} className="text-[#737d73]" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your password"
                  className="w-full min-w-0 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-[#737d73]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="text-[#96da06]"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 text-xs leading-5 text-[#a4ada5]">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-1 accent-[#b0f734]"
              />
              <span>
                I agree to the{" "}
                <a href="#terms" className="font-semibold text-[#b0f734] hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#privacy" className="font-semibold text-[#b0f734] hover:underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#b0f734] px-5 py-3.5 text-sm font-bold text-[#121413] transition hover:bg-[#96da06] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[#a4ada5]">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#b0f734] hover:underline">
              Sign in
            </Link>
          </p>
        </section>

        <div className="mt-5 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[#737d73]">
            Secure Authentication · Supabase
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
