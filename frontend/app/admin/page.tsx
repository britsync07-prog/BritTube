"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Film,
  CheckCircle2,
  XCircle,
  Loader2,
  HardDrive,
  TrendingUp,
  Clock,
  BarChart3,
} from "lucide-react";
import { getToken } from "../../lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api/v1";

interface AdminStats {
  total_users: number;
  active_users: number;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  processing_tasks: number;
  storage_mb: number;
  file_count: number;
  new_users_week: number;
  new_tasks_week: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!stats) return <p className="text-gray-500">Failed to load stats</p>;

  const statCards = [
    { label: "Total Users", value: stats.total_users, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Active Users", value: stats.active_users, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Total Videos", value: stats.total_tasks, icon: Film, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Completed", value: stats.completed_tasks, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Failed", value: stats.failed_tasks, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Processing", value: stats.processing_tasks, icon: Loader2, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Storage Used", value: `${stats.storage_mb} MB`, icon: HardDrive, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Total Files", value: stats.file_count, icon: BarChart3, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-500">Overview of your BritTube platform</p>
      </div>

      {/* Weekly Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">New Users (7d)</p>
              <p className="text-2xl font-black text-white">{stats.new_users_week}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Film className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">New Videos (7d)</p>
              <p className="text-2xl font-black text-white">{stats.new_tasks_week}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
