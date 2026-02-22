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
  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
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

  function cancelEditing() {
    setEditingUser(null);
    setEditForm({
      status: "",
      subscriptionTier: "",
      dailyTokenLimit: null,
    });
  }

  // Keyboard shortcuts for editing
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!editingUser) return;
      
      if (e.key === "Escape") {
        cancelEditing();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleUpdateUser(editingUser);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingUser]);

  const tierTokenLimits = {
    free: 0,
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
        <h1 className="text-3xl font-bold text-fg-primary">User Management</h1>
        <p className="mt-2 text-sm text-fg-secondary">Manage user accounts, approvals, and token limits</p>
      </div>

      {message && (
        <div className={`mb-6 rounded-md p-4 ${message.type === "success" ? "bg-success/10" : "bg-error/10"}`}>
          <div className="flex">
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-error" />
            )}
            <p className={`ml-3 text-sm font-medium ${message.type === "success" ? "text-success" : "text-error"}`}>
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
            className="rounded-md border-border bg-surface text-fg-primary shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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
            placeholder="Search by user ID or email..."
            className="w-full rounded-md border-border bg-surface text-fg-primary placeholder:text-fg-tertiary shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>

        <div className="text-sm text-fg-secondary">
          Total users: {pagination.total}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg bg-surface shadow-lg">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-light">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-tertiary">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-tertiary">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-tertiary">
                Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-tertiary">
                Token Limit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-tertiary">
                API Keys
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-tertiary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-fg-secondary">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-fg-secondary">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isEditing = editingUser === user.userId;
                // Use editForm tier when editing for live placeholder update, otherwise use user's tier
                const currentTier = isEditing ? editForm.subscriptionTier : user.subscriptionTier;
                const defaultTokenLimit = tierTokenLimits[currentTier as keyof typeof tierTokenLimits] || 0;
                
                return (
                  <tr 
                    key={user.userId} 
                    className={`transition-colors ${
                      isEditing 
                        ? "bg-primary/5 ring-2 ring-inset ring-primary" 
                        : "hover:bg-surface-light"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-fg-primary">{user.email}</div>
                      <div className="text-xs text-fg-tertiary">{user.userId}</div>
                      {user.isAdmin && (
                        <span className="mt-1 inline-flex rounded-full bg-accent/20 px-2 py-1 text-xs font-semibold text-accent">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="w-full max-w-[140px] rounded-md border-border bg-background text-fg-primary text-sm shadow-sm focus:border-primary focus:ring-primary"
                        >
                          <option value="approved">Approved</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            user.status === "approved"
                              ? "bg-success/20 text-success"
                              : "bg-error/20 text-error"
                          }`}
                        >
                          {user.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select
                          value={editForm.subscriptionTier}
                          onChange={(e) => setEditForm({ ...editForm, subscriptionTier: e.target.value })}
                          className="w-full max-w-[140px] rounded-md border-border bg-background text-fg-primary text-sm shadow-sm focus:border-primary focus:ring-primary"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      ) : (
                        <span className="text-sm capitalize text-fg-primary">{user.subscriptionTier}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <input
                            type="number"
                            value={editForm.dailyTokenLimit ?? ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                dailyTokenLimit: e.target.value ? parseInt(e.target.value, 10) : null,
                              })
                            }
                            placeholder={`Default: ${formatTokens(defaultTokenLimit)}`}
                            className="w-full max-w-[160px] rounded-md border-border bg-background text-fg-primary text-sm placeholder:text-fg-tertiary shadow-sm focus:border-primary focus:ring-primary"
                          />
                          <span className="text-xs text-fg-tertiary">Leave empty for tier default</span>
                        </div>
                      ) : (
                        <span className="text-sm text-fg-primary">
                          {formatTokens(user.dailyTokenLimit || defaultTokenLimit)}/day
                          {user.dailyTokenLimit && <span className="ml-1 text-xs text-primary font-medium">(custom)</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.hasApiKeys.openai && (
                          <span className="inline-flex items-center rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                            OpenAI
                          </span>
                        )}
                        {user.hasApiKeys.anthropic && (
                          <span className="inline-flex items-center rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                            Claude
                          </span>
                        )}
                        {user.hasApiKeys.gemini && (
                          <span className="inline-flex items-center rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                            Gemini
                          </span>
                        )}
                        {!user.hasApiKeys.openai && !user.hasApiKeys.anthropic && !user.hasApiKeys.gemini && (
                          <span className="text-xs text-fg-tertiary">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateUser(user.userId)}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isSaving ? (
                                <>
                                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Saving...
                                </>
                              ) : (
                                "Save"
                              )}
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={isSaving}
                              className="rounded-md bg-surface px-3 py-1.5 text-sm font-semibold text-fg-primary shadow-sm ring-1 ring-inset ring-border hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                          <span className="text-xs text-fg-tertiary">
                            Cmd/Ctrl+Enter to save, Esc to cancel
                          </span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(user)}
                            className="text-sm font-medium text-primary hover:text-primary-light transition-colors"
                          >
                            Edit
                          </button>
                          {user.status === "suspended" && (
                            <button
                              onClick={() => handleQuickAction(user.userId, "approve")}
                              className="text-sm font-medium text-success hover:brightness-125 transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {user.status === "approved" && (
                            <button
                              onClick={() => handleQuickAction(user.userId, "suspend")}
                              className="text-sm font-medium text-warning hover:brightness-125 transition-colors"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
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
            className="rounded-md bg-surface px-4 py-2 text-sm font-semibold text-fg-primary shadow-sm ring-1 ring-inset ring-border hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-fg-secondary">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="rounded-md bg-surface px-4 py-2 text-sm font-semibold text-fg-primary shadow-sm ring-1 ring-inset ring-border hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
