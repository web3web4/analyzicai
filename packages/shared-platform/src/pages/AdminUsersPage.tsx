"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface User {
  userId: string;
  email: string;
  lastSignIn: string | null;
  status: string;
  subscriptionTier: string;
  dailyTokenLimit: number | null;
  isAdmin: boolean;
  hasApiKeys: {
    openai: boolean;
    anthropic: boolean;
    gemini: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    status: string;
    subscriptionTier: string;
    dailyTokenLimit: number | null;
  }>({
    status: "",
    subscriptionTier: "",
    dailyTokenLimit: null,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, statusFilter, searchQuery]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
        setMessage(null);
      } else if (response.status === 403) {
        setMessage({ type: "error", text: "Access denied. Admin privileges required." });
      } else {
        setMessage({ type: "error", text: "Failed to fetch users" });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage({ type: "error", text: "Failed to fetch users" });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateUser(userId: string) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        setEditingUser(null);
        await fetchUsers();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update user" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage({ type: "error", text: "Failed to update user" });
    }
  }

  async function handleQuickAction(userId: string, action: "approve" | "suspend") {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "approve" ? "approved" : "suspended" }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: `User ${action}d successfully` });
        await fetchUsers();
      } else {
        setMessage({ type: "error", text: data.error || `Failed to ${action} user` });
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      setMessage({ type: "error", text: `Failed to ${action} user` });
    }
  }

  function startEditing(user: User) {
    setEditingUser(user.userId);
    setEditForm({
      status: user.status,
      subscriptionTier: user.subscriptionTier,
      dailyTokenLimit: user.dailyTokenLimit,
    });
  }

  const tierTokenLimits = {
    free: 50_000,
    pro: 1_000_000,
    enterprise: 10_000_000,
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
    if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
    return tokens.toString();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-sm text-gray-600">Manage user accounts, approvals, and token limits</p>
      </div>

      {message && (
        <div className={`mb-6 rounded-md p-4 ${message.type === "success" ? "bg-green-50" : "bg-red-50"}`}>
          <div className="flex">
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-400" />
            )}
            <p className={`ml-3 text-sm font-medium ${message.type === "success" ? "text-green-800" : "text-red-800"}`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            placeholder="Search by user ID..."
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="text-sm text-gray-600">
          Total users: {pagination.total}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Token Limit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                API Keys
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                    <div className="text-xs text-gray-500">{user.userId}</div>
                    {user.isAdmin && (
                      <span className="mt-1 inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.userId ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="approved">Approved</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          user.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.userId ? (
                      <select
                        value={editForm.subscriptionTier}
                        onChange={(e) => setEditForm({ ...editForm, subscriptionTier: e.target.value })}
                        className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    ) : (
                      <span className="text-sm capitalize text-gray-900">{user.subscriptionTier}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.userId ? (
                      <input
                        type="number"
                        value={editForm.dailyTokenLimit ?? ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            dailyTokenLimit: e.target.value ? parseInt(e.target.value, 10) : null,
                          })
                        }
                        placeholder="Default"
                        className="w-24 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {formatTokens(user.dailyTokenLimit || tierTokenLimits[user.subscriptionTier as keyof typeof tierTokenLimits] || 50_000)}/day
                        {user.dailyTokenLimit && <span className="text-xs text-gray-500"> (custom)</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {user.hasApiKeys.openai && <span className="text-xs text-green-600">OpenAI</span>}
                      {user.hasApiKeys.anthropic && <span className="text-xs text-green-600">Claude</span>}
                      {user.hasApiKeys.gemini && <span className="text-xs text-green-600">Gemini</span>}
                      {!user.hasApiKeys.openai && !user.hasApiKeys.anthropic && !user.hasApiKeys.gemini && (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.userId ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateUser(user.userId)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(user)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        {user.status === "suspended" && (
                          <button
                            onClick={() => handleQuickAction(user.userId, "approve")}
                            className="text-sm font-medium text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                        )}
                        {user.status === "approved" && (
                          <button
                            onClick={() => handleQuickAction(user.userId, "suspend")}
                            className="text-sm font-medium text-red-600 hover:text-red-900"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
