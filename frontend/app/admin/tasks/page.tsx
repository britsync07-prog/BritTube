"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Trash2,
  Film,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
} from "lucide-react";
import { getToken } from "../../../lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api/v1";
const TASKS_BASE_URL = API_BASE.replace(/\/api\/v1\/?$/, "");

interface Task {
  id: number;
  task_id: string;
  user_id: number;
  video_subject: string;
  video_url: string;
  state: number;
  progress: number;
  created_at: string;
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTasks = async (p: number, state: string) => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({ page: String(p), page_size: "20" });
      if (state) params.set("state", state);
      const res = await fetch(`${API_BASE}/admin/tasks?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(page, filter);
  }, [page, filter]);

  const deleteTask = async (taskId: string) => {
    if (!confirm("Delete this task and all its files?")) return;
    setActionLoading(taskId);
    try {
      const token = getToken();
      await fetch(`${API_BASE}/admin/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks(page, filter);
    } finally {
      setActionLoading(null);
    }
  };

  const getStateBadge = (state: number) => {
    if (state === 1) return { label: "Complete", color: "text-green-400 bg-green-500/10", icon: CheckCircle2 };
    if (state === -1) return { label: "Failed", color: "text-red-400 bg-red-500/10", icon: XCircle };
    return { label: "Processing", color: "text-amber-400 bg-amber-500/10", icon: Loader2 };
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Task Management</h1>
        <p className="text-gray-500 mt-1">{total} total tasks</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { value: "", label: "All" },
          { value: "1", label: "Complete" },
          { value: "4", label: "Processing" },
          { value: "-1", label: "Failed" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              filter === f.value
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Video</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">User ID</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Progress</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Created</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto" />
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">No tasks found</td>
                </tr>
              ) : (
                tasks.map((t) => {
                  const badge = getStateBadge(t.state);
                  return (
                    <tr key={t.task_id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Film className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium line-clamp-1 max-w-xs">
                              {t.video_subject || "Untitled"}
                            </p>
                            <p className="text-gray-500 text-xs font-mono">{t.task_id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">#{t.user_id}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${badge.color}`}>
                          <badge.icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all"
                              style={{ width: `${t.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{t.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {t.state === 1 && t.video_url && (
                            <a
                              href={t.video_url.startsWith("http") ? t.video_url : `${TASKS_BASE_URL}${t.video_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-white transition-colors p-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => deleteTask(t.task_id)}
                            disabled={actionLoading === t.task_id}
                            className="text-gray-500 hover:text-red-400 transition-colors p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
