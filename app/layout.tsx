"use client";

import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="font-semibold tracking-tight">CivicPulse</span>
          </Link>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-400">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
          <Link href="/demo" className="hover:text-white transition-colors">
            Demo
          </Link>
          <Link href="/ask" className="hover:text-white transition-colors">
            Ask AI
          </Link>
          <Link href="/architecture" className="hover:text-white transition-colors">
            Architecture
          </Link>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
