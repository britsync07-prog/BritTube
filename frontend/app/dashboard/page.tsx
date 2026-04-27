"use client";

import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Cpu, Zap, Film, LogOut, Crown,
  Clock, CheckCircle2, TrendingUp
} from "lucide-react";
import { VideoGenerator } from "../../components/sections/VideoGenerator";
import { VideoHistory } from "../../components/sections/VideoHistory";

const PLAN_COLORS: Record<string, string> = {
  free: "text-gray-400 bg-gray-400/10 border-gray-400/20",
  pro: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  enterprise: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
};

const stats = [
  { label: "Videos Generated", value: "0", icon: Film, color: "text-purple-400" },
  { label: "Minutes Saved", value: "0", icon: Clock, color: "text-indigo-400" },
  { label: "Viral Score Avg.", value: "—", icon: TrendingUp, color: "text-green-400" },
];

export default function DashboardPage() {
  const { user, loading, logout } = useAuth(true);
  const [activeTab, setActiveTab] = useState("generate");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const planLabel = user.plan.charAt(0).toUpperCase() + user.plan.slice(1);
  const planColorClass = PLAN_COLORS[user.plan] ?? PLAN_COLORS.free;

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Nav */}
      <header className="border-b border-white/5 bg-white/[0.02] backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Brit<span className="text-purple-400">Tube</span>
            </span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="flex items-start justify-between flex-wrap gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <p className="text-sm font-medium text-gray-500 mb-1">Creator Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {user.full_name} 👋
            </h1>
          </motion.div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${planColorClass}`}>
              <Crown className="w-3 h-3" />
              {planLabel} Plan
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Generator or History */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 w-fit">
              <button
                onClick={() => setActiveTab("generate")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "generate" ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                Create Video
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "history" ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                My History
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "generate" ? (
                <motion.div
                  key="generate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <VideoGenerator />
                </motion.div>
              ) : (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold">Generation History</h3>
                      <div className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        Storage: Cloud
                      </div>
                    </div>
                    <VideoHistory />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Sidebar Stats & Actions */}
          <div className="lg:col-span-4 space-y-6">
             {/* Stats Card */}
             <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Account Overview</h3>
                <div className="space-y-6">
                  {stats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                          <stat.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-gray-400">{stat.label}</span>
                      </div>
                      <span className="text-lg font-black">{stat.value}</span>
                    </div>
                  ))}
                </div>
             </div>

             {/* Upgrade Card */}
             {user.plan === "free" && (
                <div className="rounded-3xl border border-purple-500/30 bg-purple-500/5 p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-purple-500/20 transition-all" />
                  <Crown className="w-8 h-8 text-purple-400 mb-4" />
                  <h3 className="text-lg font-bold mb-1">Get Unlimited Access</h3>
                  <p className="text-sm text-gray-400 mb-6">Upgrade to Pro and generate up to 100 videos per month.</p>
                  <button className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-white text-black transition-all">
                    Upgrade Now
                  </button>
                </div>
             )}

             {/* Support Card */}
             <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <h4 className="text-sm font-bold mb-2">Need help?</h4>
                <p className="text-xs text-gray-500 mb-4">Our support team is available 24/7 for technical assistance.</p>
                <Link href="#" className="text-xs font-bold text-purple-400 hover:text-purple-300">
                  Contact Support →
                </Link>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
