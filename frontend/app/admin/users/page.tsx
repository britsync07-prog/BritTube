"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Trash2,
  Shield,
  Crown,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { getToken } from "../../../lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api/v1";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  plan: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchUsers = async (p: number, q: string) => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({ page: String(p), page_size: "20" });
      if (q) params.set("search", q);
      const res = await fetch(`${API_BASE}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, search);
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1, search);
  };

  const updateRole = async (userId: number, role: string) => {
    setActionLoading(userId);
    try {
      const token = getToken();
      await fetch(`${API_BASE}/admin/users/${userId}/role?role=${role}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(page, search);
    } finally {
      setActionLoading(null);
    }
  };

  const updatePlan = async (userId: number, plan: string) => {
    setActionLoading(userId);
    try {
      const token = getToken();
      await fetch(`${API_BASE}/admin/users/${userId}/plan?plan=${plan}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(page, search);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleStatus = async (userId: number) => {
    setActionLoading(userId);
    try {
      const token = getToken();
      await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(page, search);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("Delete this user and all their tasks?")) return;
    setActionLoading(userId);
    try {
      const token = getToken();
      await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(page, search);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">User Management</h1>
          <p className="text-gray-500 mt-1">{total} total users</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by email or name..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">User</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Plan</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Joined</th>
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">
                          {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-white font-medium">{u.full_name}</p>
                          <p className="text-gray-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        disabled={actionLoading === u.id}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.plan}
                        onChange={(e) => updatePlan(u.id, e.target.value)}
                        disabled={actionLoading === u.id}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(u.id)}
                        disabled={actionLoading === u.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          u.is_active
                            ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                            : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        }`}
                      >
                        {u.is_active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {u.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteUser(u.id)}
                        disabled={actionLoading === u.id}
                        className="text-gray-500 hover:text-red-400 transition-colors p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
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
