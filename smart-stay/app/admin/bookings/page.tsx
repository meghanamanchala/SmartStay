"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/components/navbar/AdminNavbar";
import { CalendarDays, DollarSign, CalendarClock, CalendarX2, Search, Bell, Ellipsis } from "lucide-react";

interface Booking {
  _id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus?: string;
  createdAt?: string;
  guestDetails?: {
    name: string;
    email: string;
  };
  propertyDetails?: {
    title: string;
    city: string;
  };
  hostDetails?: {
    name: string;
  };
}

const AdminBookingsPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuPopup, setMenuPopup] = useState<{
    bookingId: string;
    top: number;
    left: number;
  } | null>(null);
  const [actionLoadingBookingId, setActionLoadingBookingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/admin/all-bookings");
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings || []);
        } else {
          setError("Failed to fetch bookings");
        }
      } catch (err) {
        setError("Error loading bookings");
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") {
      fetchBookings();
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
      if (!target.closest("[data-floating-booking-menu]") && !target.closest("[data-booking-action-trigger]")) {
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

  const normalizedBookings = bookings.map((booking) => ({
    ...booking,
    status: (booking.status || "pending").toLowerCase(),
  }));

  const filteredBookings = normalizedBookings
    .filter((booking) => statusFilter === "all" || booking.status === statusFilter)
    .filter((booking, index) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;
      const bookingId = `BK-${String(index + 1).padStart(3, "0")}`.toLowerCase();
      return (
        bookingId.includes(query) ||
        booking.guestDetails?.name?.toLowerCase().includes(query) ||
        booking.propertyDetails?.title?.toLowerCase().includes(query)
      );
    });

  const getStatusBadge = (bookingStatus: string) => {
    switch (bookingStatus) {
      case "confirmed":
        return (
          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
            Confirmed
          </span>
        );
      case "checked-in":
        return (
          <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-600">
            Checked-In
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
            Cancelled
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {bookingStatus}
          </span>
        );
    }
  };

  const formatDate = (dateValue?: string) => {
    if (!dateValue) return "-";
    return new Date(dateValue).toLocaleDateString("en-GB");
  };

  const totalBookings = normalizedBookings.length;
  const totalRevenue = normalizedBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
  const pendingBookings = normalizedBookings.filter((booking) => booking.status === "pending").length;
  const cancelledBookings = normalizedBookings.filter((booking) => booking.status === "cancelled").length;

  const statusTabs = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "checked-in", label: "Checked-In" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const getBookingActions = (bookingStatus: string) => {
    const status = bookingStatus.toLowerCase();

    if (status === "pending") {
      return [
        { label: "Confirm Booking", nextStatus: "confirmed" },
        { label: "Cancel Booking", nextStatus: "cancelled" },
      ] as const;
    }

    if (status === "confirmed") {
      return [
        { label: "Check-In Booking", nextStatus: "checked-in" },
        { label: "Cancel Booking", nextStatus: "cancelled" },
      ] as const;
    }

    if (status === "checked-in") {
      return [{ label: "Complete Booking", nextStatus: "completed" }] as const;
    }

    return [] as const;
  };

  const updateBookingStatus = async (
    bookingId: string,
    nextStatus: "confirmed" | "checked-in" | "completed" | "cancelled"
  ) => {
    setActionLoadingBookingId(bookingId);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        setActionMessage({ type: "error", text: data.error || "Action failed" });
        return;
      }

      setBookings((previousBookings) =>
        previousBookings.map((booking) =>
          booking._id === bookingId
            ? {
                ...booking,
                status: data.booking?.status ?? nextStatus,
              }
            : booking
        )
      );

      setActionMessage({ type: "success", text: "Booking updated successfully" });
      setMenuPopup(null);
    } catch {
      setActionMessage({ type: "error", text: "Network error while updating booking" });
    } finally {
      setActionLoadingBookingId(null);
    }
  };

  const toggleBookingActionMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    bookingId: string
  ) => {
    const isAlreadyOpen = menuPopup?.bookingId === bookingId;
    if (isAlreadyOpen) {
      setMenuPopup(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 196;
    const menuHeight = 150;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < menuHeight ? rect.top - menuHeight - 8 : rect.bottom + 8;
    const left = Math.max(16, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 16));

    setMenuPopup({ bookingId, top, left });
  };

  const activeMenuBooking = menuPopup
    ? normalizedBookings.find((booking) => booking._id === menuPopup.bookingId)
    : null;

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
        <AdminNavbar />
        <main className="ml-64 flex-1 p-10">
          <div className="text-teal-600 text-lg font-semibold animate-pulse">Loading bookings...</div>
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
            <h1 className="text-3xl font-extrabold tracking-tight text-teal-600">Booking Management</h1>
            <p className="mt-2 text-base text-slate-500">Track and manage all platform bookings</p>
          </div>
          <button className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
            <Bell className="h-5 w-5" />
          </button>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-teal-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalBookings}</p>
                  <p className="text-sm font-semibold text-slate-500">Total Bookings</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
                  <p className="text-sm font-semibold text-slate-500">Total Revenue</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{pendingBookings}</p>
                  <p className="text-sm font-semibold text-slate-500">Pending</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <CalendarX2 className="h-5 w-5 text-rose-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{cancelledBookings}</p>
                  <p className="text-sm font-semibold text-slate-500">Cancelled</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">{error}</div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {actionMessage ? (
              <div className={`mx-4 mt-4 rounded-xl border px-4 py-3 text-sm ${actionMessage.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                {actionMessage.text}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:gap-3">
              <div className="relative w-full lg:w-[55%] lg:min-w-[320px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by ID, guest, or property..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 lg:flex-nowrap">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      statusFilter === tab.value
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
                  <th className="px-4 py-4 text-left font-semibold">Booking ID</th>
                  <th className="px-4 py-4 text-left font-semibold">Guest</th>
                  <th className="px-4 py-4 text-left font-semibold">Property</th>
                  <th className="px-4 py-4 text-left font-semibold">Check-in</th>
                  <th className="px-4 py-4 text-left font-semibold">Check-out</th>
                  <th className="px-4 py-4 text-left font-semibold">Amount</th>
                  <th className="px-4 py-4 text-left font-semibold">Status</th>
                  <th className="px-4 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking, index) => (
                    <tr key={booking._id} className="border-b border-slate-100 text-slate-700 transition hover:bg-slate-50/60">
                      <td className="px-4 py-4 font-semibold text-slate-700">
                        BK-{String(index + 1).padStart(3, "0")}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {booking.guestDetails?.name || "Unknown Guest"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{booking.propertyDetails?.title || "Unknown Property"}</p>
                        <p className="text-xs text-slate-500">by {booking.hostDetails?.name || "Unknown Host"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(booking.checkIn)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(booking.checkOut)}</td>
                      <td className="px-4 py-3 font-semibold text-teal-500">
                        ${Number(booking.totalPrice || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(event) => toggleBookingActionMenu(event, booking._id)}
                          data-booking-action-trigger="true"
                          disabled={actionLoadingBookingId === booking._id || getBookingActions(booking.status).length === 0}
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
              Showing {filteredBookings.length} of {normalizedBookings.length} bookings
            </div>
          </section>
        )}

        {menuPopup && activeMenuBooking ? (
          <div
            data-floating-booking-menu="true"
            className="fixed z-[70] w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-2xl ring-1 ring-slate-100"
            style={{ top: menuPopup.top, left: menuPopup.left }}
          >
            {getBookingActions(activeMenuBooking.status).length > 0 ? (
              getBookingActions(activeMenuBooking.status).map((action) => (
                <button
                  key={action.nextStatus}
                  onClick={() => updateBookingStatus(activeMenuBooking._id, action.nextStatus)}
                  disabled={actionLoadingBookingId === activeMenuBooking._id}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    action.nextStatus === "cancelled"
                      ? "text-rose-600 hover:bg-rose-50"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {action.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500">No actions available</div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default AdminBookingsPage;
