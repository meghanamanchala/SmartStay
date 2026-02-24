"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/navbar/AdminNavbar";
import { Search, Bell, Users, UserCheck, UserRound, House, Shield, Home as HomeIcon, Ellipsis } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  bookingCount?: number;
  bookingsCount?: number;
  createdAt?: string;
}

const UsersPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuPopup, setMenuPopup] = useState<{
    userId: string;
    top: number;
    left: number;
  } | null>(null);
  const [actionLoadingUserId, setActionLoadingUserId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/admin/all-users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        } else {
          setError("Failed to fetch users");
        }
      } catch (err) {
        setError("Error loading users");
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") {
      fetchUsers();
    }
  }, [status]);

  useEffect(() => {
    const hideMessage = setTimeout(() => {
      setActionMessage(null);
    }, 3000);

    return () => clearTimeout(hideMessage);
  }, [actionMessage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-floating-action-menu]") && !target.closest("[data-action-trigger]")) {
        setMenuPopup(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuPopup(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const filteredUsers = users
    .filter((user) => roleFilter === "all" || user.role === roleFilter)
    .filter((user) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    });

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => (user.status || "active").toLowerCase() === "active").length;
  const guestUsers = users.filter((user) => user.role === "guest").length;
  const hostUsers = users.filter((user) => user.role === "host").length;

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB");
  };

  const getInitials = (name: string) => {
    const words = name?.trim().split(" ").filter(Boolean) || [];
    return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "U";
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="w-4 h-4 text-red-500" />;
      case "host": return <HomeIcon className="w-4 h-4 text-amber-600" />;
      default: return <UserRound className="w-4 h-4 text-teal-500" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin": return "bg-rose-50 text-rose-600";
      case "host": return "bg-amber-50 text-amber-600";
      default: return "bg-teal-50 text-teal-600";
    }
  };

  const getStatusBadgeClass = (statusValue?: string) => {
    const status = (statusValue || "active").toLowerCase();
    return status === "active"
      ? "bg-emerald-50 text-emerald-600"
      : "bg-rose-50 text-rose-600";
  };

  const updateUserById = async (id: string, payload: { role?: "guest" | "host"; status?: "active" | "suspended" }) => {
    setActionLoadingUserId(id);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setActionMessage({ type: "error", text: data.error || "Action failed" });
        return;
      }

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user._id === id
            ? {
                ...user,
                role: data.user?.role ?? user.role,
                status: data.user?.status ?? user.status,
              }
            : user
        )
      );
      setActionMessage({ type: "success", text: "User updated successfully" });
      setMenuPopup(null);
    } catch {
      setActionMessage({ type: "error", text: "Network error while updating user" });
    } finally {
      setActionLoadingUserId(null);
    }
  };

  const deleteUserById = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) {
      return;
    }

    setActionLoadingUserId(id);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setActionMessage({ type: "error", text: data.error || "Delete failed" });
        return;
      }

      setUsers((previousUsers) => previousUsers.filter((user) => user._id !== id));
      setActionMessage({ type: "success", text: "User deleted" });
      setMenuPopup(null);
    } catch {
      setActionMessage({ type: "error", text: "Network error while deleting user" });
    } finally {
      setActionLoadingUserId(null);
    }
  };

  const toggleUserActionMenu = (event: React.MouseEvent<HTMLButtonElement>, userId: string) => {
    const isAlreadyOpen = menuPopup?.userId === userId;
    if (isAlreadyOpen) {
      setMenuPopup(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = 150;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < menuHeight ? rect.top - menuHeight - 8 : rect.bottom + 8;
    const left = Math.max(16, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 16));

    setMenuPopup({ userId, top, left });
  };

  const activeMenuUser = menuPopup ? users.find((user) => user._id === menuPopup.userId) : null;

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
        <AdminNavbar />
        <main className="ml-64 flex-1 p-10">
          <div className="text-teal-600 text-lg font-semibold animate-pulse">Loading users...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      <AdminNavbar />
      <main className="ml-64 flex-1 p-10">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-teal-600">User Management</h1>
            <p className="mt-2 text-base text-slate-500">View and manage all platform users</p>
          </div>
          <button className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
            <Bell className="h-5 w-5" />
          </button>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-teal-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
                  <p className="text-sm font-semibold text-slate-500">Total Users</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-teal-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{activeUsers}</p>
                  <p className="text-sm font-semibold text-slate-500">Active Users</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-teal-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{guestUsers}</p>
                  <p className="text-sm font-semibold text-slate-500">Guests</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <House className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{hostUsers}</p>
                  <p className="text-sm font-semibold text-slate-500">Hosts</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">{error}</div>
        ) : (
          <section className="overflow-visible rounded-2xl border border-slate-200 bg-white">
            {actionMessage ? (
              <div className={`mx-4 mt-4 rounded-xl border px-4 py-3 text-sm ${actionMessage.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                {actionMessage.text}
              </div>
            ) : null}

            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-3xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search users..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "admin", label: "Admin" },
                  { value: "host", label: "Host" },
                  { value: "guest", label: "Guest" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setRoleFilter(tab.value)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      roleFilter === tab.value
                        ? "bg-teal-500 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="px-4 py-4 text-left font-semibold">User</th>
                  <th className="px-4 py-4 text-left font-semibold">Role</th>
                  <th className="px-4 py-4 text-left font-semibold">Status</th>
                  <th className="px-4 py-4 text-left font-semibold">Joined</th>
                  <th className="px-4 py-4 text-left font-semibold">Bookings</th>
                  <th className="px-4 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b border-slate-100 text-slate-700 transition hover:bg-slate-50/60">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 font-semibold text-teal-600">
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{user.name || "Unnamed User"}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role || "guest")}`}>
                          {getRoleIcon(user.role || "guest")}
                          {user.role || "guest"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(user.status)}`}>
                          {(user.status || "active").toLowerCase() === "active" ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{user.bookingCount ?? user.bookingsCount ?? 0}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(event) => toggleUserActionMenu(event, user._id)}
                          data-action-trigger="true"
                          disabled={actionLoadingUserId === user._id}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Ellipsis className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="px-4 py-3 text-sm text-slate-500">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </section>
        )}

        {menuPopup && activeMenuUser ? (
          <div
            data-floating-action-menu="true"
            className="fixed z-[70] w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-2xl ring-1 ring-slate-100"
            style={{ top: menuPopup.top, left: menuPopup.left }}
          >
            {activeMenuUser.role !== "admin" ? (
              <button
                onClick={() => updateUserById(activeMenuUser._id, { role: activeMenuUser.role === "host" ? "guest" : "host" })}
                disabled={actionLoadingUserId === activeMenuUser._id}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Set as {activeMenuUser.role === "host" ? "Guest" : "Host"}
              </button>
            ) : null}

            {activeMenuUser.role !== "admin" ? (
              <button
                onClick={() => updateUserById(activeMenuUser._id, { status: (activeMenuUser.status || "active").toLowerCase() === "active" ? "suspended" : "active" })}
                disabled={actionLoadingUserId === activeMenuUser._id}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {(activeMenuUser.status || "active").toLowerCase() === "active" ? "Suspend User" : "Activate User"}
              </button>
            ) : null}

            <button
              onClick={() => deleteUserById(activeMenuUser._id)}
              disabled={actionLoadingUserId === activeMenuUser._id || activeMenuUser.role === "admin"}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete User
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default UsersPage;