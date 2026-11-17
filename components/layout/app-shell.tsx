
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Dumbbell,
  LayoutDashboard,
  ChartNoAxesCombined,
  Utensils,
  UserRound,
  LogOut,
  LogIn,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/progress", label: "Progress", icon: ChartNoAxesCombined },
  { href: "/exercise", label: "Exercise", icon: Dumbbell },
  { href: "/food-history", label: "Food History", icon: Utensils },
  { href: "/profile", label: "Profile & Goals", icon: UserRound },
];

function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
      className={
        mobile
          ? "grid grid-cols-5 gap-1"
          : "flex flex-col gap-2"
      }
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/" && pathname.startsWith(`${href}/`));

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`${
              mobile
                ? "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px]"
                : "flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
            } transition-colors ${
              active
                ? "bg-lime-300 font-semibold text-zinc-950"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Icon size={mobile ? 19 : 18} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("Loading...");
  const [initial, setInitial] = useState("U");
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Listen for login and logout changes.
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      setLoggingOut(false);
    });

    async function loadInitialUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setUser(error ? null : user);
      setLoadingUser(false);
    }

    loadInitialUser();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load the current user's profile whenever the account changes.
  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!user) {
        setDisplayName("My Account");
        setInitial("U");
        return;
      }

      const supabase = createClient();

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      const name =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email ||
        "My Account";

      setDisplayName(name);
      setInitial(name.trim().charAt(0).toUpperCase() || "U");
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout failed:", error);
        alert("Unable to log out. Please try again.");
        return;
      }

      setUser(null);
      setDisplayName("My Account");
      setInitial("U");
      setLoggingOut(false);

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Something went wrong while logging out.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080a09] text-[#f4f7f3]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col border-r border-white/5 bg-[#0d0f0e] px-4 py-6 md:flex">
        <Link href="/" className="mb-5 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-zinc-950">
            <Activity size={23} />
          </span>

          <span>
            <strong className="block text-lg">FitAI Coach</strong>
            <small className="text-xs text-zinc-500">
              Fitness companion
            </small>
          </span>
        </Link>

        <NavLinks />

        {/* Account Section */}
        <div className="mt-auto border-t border-white/5 pt-4">
          {!loadingUser && user ? (
            <>
              <div className="flex items-center gap-3 rounded-xl bg-zinc-900 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-300 font-bold text-zinc-950">
                  {initial}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {displayName}
                  </p>

                  <p className="text-xs text-zinc-500">
                    Signed-in account
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut size={15} />
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex w-full items-center gap-3 rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-lime-200"
            >
              <LogIn size={17} />
              {loadingUser ? "Loading account..." : "Login"}
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-h-screen md:pl-[250px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#080a09]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-300 text-zinc-950">
              <Activity size={19} />
            </span>

            <strong>FitAI Coach</strong>
          </Link>


          {/* <div className="ml-auto flex items-center">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-sm font-semibold"
              aria-label={`${displayName}'s profile`}
              title={displayName}
            >
              {initial}
            </div>
          </div> */}
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0d0f0e]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
        <NavLinks mobile />
      </div>
    </div>
  );
}
