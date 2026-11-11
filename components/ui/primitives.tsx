import type { ReactNode, ButtonHTMLAttributes } from "react";

export function Card({
  children,
  className = "",
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <section
      aria-label={ariaLabel}
      className={`rounded-2xl border border-white/[0.07] bg-[#111512] ${className}`}
    >
      {children}
    </section>
  );
}
export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-base font-semibold sm:text-lg">{title}</h2>{subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}</div>{action}</div>;
}
export function PrimaryButton({
  type = "button",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}
export function DemoBanner() {
  return <div className="mb-5 flex items-start gap-3 rounded-xl border border-lime-300/15 bg-lime-300/[0.04] px-4 py-3 text-sm text-zinc-400"><span className="mt-0.5 text-lime-300">●</span><p><strong className="mr-1 text-lime-300">Phase 2 demo:</strong> values and interactions are illustrative and stored only in temporary frontend state.</p></div>;
}
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center"><span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-xl text-lime-300">✳</span><h3 className="font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}
