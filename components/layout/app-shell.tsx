"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard, ChartNoAxesCombined, Utensils, UserRound, RotateCcw } from "lucide-react";
import { useDemo } from "@/lib/demo/demo-store";
import type { ReactNode } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/progress", label: "Progress", icon: ChartNoAxesCombined },
  { href: "/food-history", label: "Food History", icon: Utensils },
  { href: "/profile", label: "Profile & Goals", icon: UserRound },
];

function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return <nav aria-label={mobile ? "Mobile navigation" : "Main navigation"} className={mobile ? "grid grid-cols-4 gap-1" : "flex flex-col gap-2"}>
    {links.map(({ href, label, icon: Icon }) => {
      const active =
  pathname === href ||
  (href !== "/" && pathname.startsWith(`${href}/`));
      return <Link key={href} href={href} aria-current={active ? "page" : undefined}
        className={`${mobile ? "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px]" : "flex items-center gap-3 rounded-xl px-4 py-3 text-sm"} transition-colors ${active ? "bg-lime-300 text-zinc-950 font-semibold" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>
        <Icon size={mobile ? 19 : 18} aria-hidden="true" /><span>{label}</span>
      </Link>;
    })}
  </nav>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, resetDemo } = useDemo();

  // const authRoutes = [
  //   "/login",
  //   "/signup",
  //   "/verify-email",
  //   "/forgot-password",
  // ];

  // if (authRoutes.includes(pathname)) {
  //   return <>{children}</>;
  // }
  return <div className="min-h-screen bg-[#080a09] text-[#f4f7f3]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col border-r border-white/5 bg-[#0d0f0e] px-4 py-6 md:flex">
      <Link href="/" className="mb-5 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-zinc-950"><Activity size={23}/></span>
        <span><strong className="block text-lg">FitAI Coach</strong><small className="text-xs text-zinc-500">Fitness companion</small></span>
      </Link>
      <div className="mb-7 rounded-full border border-lime-300/20 bg-lime-300/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-lime-300">● Demo mode · Phase 2</div>
      <NavLinks />
      <div className="mt-auto border-t border-white/5 pt-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-zinc-900 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-300 font-bold text-zinc-950">{profile.name.slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{profile.name}</p><p className="text-xs text-zinc-500">Demo profile</p></div>
        </div>
        <button
  onClick={() => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all demo data? This action cannot be undone."
    );

    if (confirmed) {
      resetDemo();
    }
  }}
  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-white"
>
  <RotateCcw size={14} />
  Reset demo data
</button>
      </div>
    </aside>
    <div className="min-h-screen md:pl-[250px]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#080a09]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 md:hidden"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-300 text-zinc-950"><Activity size={19}/></span><strong>FitAI Coach</strong></Link>
        <div className="hidden items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-400 sm:flex"><span className="h-2 w-2 rounded-full bg-lime-300"/> Sample data only — no live services connected</div>
        <div className="ml-auto flex items-center">
  <div
    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-sm font-semibold"
    aria-label={`${profile.name}'s profile`}
  >
    {profile.name.slice(0, 1).toUpperCase()}
  </div>
</div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 md:pb-8">{children}</main>
    </div>
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0d0f0e]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden"><NavLinks mobile /></div>
  </div>;
}
