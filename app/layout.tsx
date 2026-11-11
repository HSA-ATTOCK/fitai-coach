import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";
import "./fitai-stitch-theme.css";
import { AppShell } from "@/components/layout/app-shell";
import { DemoProvider } from "@/lib/demo/demo-store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitAI Coach | Your Personal Fitness Assistant",
  description:
    "Track your meals, nutrition, workouts, water intake, and fitness progress with FitAI Coach.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en" data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* <body className="min-h-full flex flex-col">{children}</body> */}
      <body>
  <DemoProvider>
    <AppShell>{children}</AppShell>
  </DemoProvider>
</body>
    </html>
  );
}
