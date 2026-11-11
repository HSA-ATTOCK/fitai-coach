
"use client";
import { AuthShell } from "@/components/auth/auth-shell";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("Please enter your email and password.");
      return;
    }

    alert("Demo login only. Real authentication is not connected yet.");
  }

  return (
  <AuthShell>
    <main className="relative flex min-h-[calc(100vh-10rem)] items-center justify-center overflow-hidden bg-[#121413] px-4 py-12 text-[#e2e3e0]">
      <div className="w-full max-w-md">
        {/* <Link href="/" className="mb-10 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b0f734] font-bold text-[#121413]">
            F
          </span>
          <span className="text-xl font-extrabold">FitAI Coach</span>
        </Link> */}

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
    alert("Google sign-in is a demo feature. Authentication is not connected.")
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
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
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
                <label htmlFor="password" className="text-sm font-medium">
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
                  onClick={() => setShowPassword((current) => !current)}
                  className="px-4 text-xs font-semibold text-[#96da06]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-[#a4ada5]">
              <input
                type="checkbox"
                className="accent-[#b0f734]"
              />
              Remember me
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#b0f734] px-5 py-3.5 text-sm font-bold text-[#121413] transition hover:bg-[#96da06]"
            >
              Sign In
            </button>
          </form>


<div className="mt-7 border-t border-[#424935] pt-6">
  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#96da06]">
    Quick Demo Access
  </p>

  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => {
        setEmail("alex@fitai.demo");
        setPassword("demo123");
      }}
      className="rounded-xl border border-[#424935] bg-[#121413] p-3 text-left transition hover:border-[#b0f734]"
    >
      <span className="block text-sm font-bold text-white">
        Alex Rivera
      </span>
      <span className="mt-1 block text-[10px] text-[#a4ada5]">
        Demo Athlete
      </span>
    </button>

    <button
      type="button"
      onClick={() => {
        setEmail("sarah@fitai.demo");
        setPassword("demo123");
      }}
      className="rounded-xl border border-[#424935] bg-[#121413] p-3 text-left transition hover:border-[#b0f734]"
    >
      <span className="block text-sm font-bold text-white">
        Dr. Sarah Vance
      </span>
      <span className="mt-1 block text-[10px] text-[#a4ada5]">
        Demo Athlete
      </span>
    </button>
  </div>

  <p className="mt-3 text-[10px] text-[#737d73]">
    Sample credentials only. Real authentication is not connected.
  </p>
</div>


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

        
{/* Demo Information Banner */}
<div className="mt-6 rounded-xl border border-[#b0f734]/20 bg-[#b0f734]/5 p-4">
  <div className="flex items-start gap-3">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#b0f734]/10 text-[#b0f734]">
      <span className="text-lg">ⓘ</span>
    </span>

    <div>
      <p className="text-xs font-bold text-[#b0f734]">
        Phase 2 Authentication Sandbox
      </p>
      <p className="mt-1 text-xs leading-5 text-[#a4ada5]">
        You are using the frontend demonstration of FitAI Coach.
        Authentication and email services are not connected.
      </p>
    </div>
  </div>
</div>

{/* System Status Footer */}
<div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] uppercase tracking-wider text-[#737d73]">
  <span className="flex items-center gap-2">
    <span className="h-2 w-2 rounded-full bg-[#b0f734]" />
    UI System Online
  </span>

  <span>Frontend Demo</span>

  <span>Version 2.0.0</span>
</div>

      </div>
    </main>
    </AuthShell>
  );
}
