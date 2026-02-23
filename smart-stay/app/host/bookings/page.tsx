"use client";

import HostNavbar from '@/components/navbar/HostNavbar';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface Booking {
  _id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status?: string;
  paymentStatus?: string;
  paymentPaidAt?: string;
  property?: {
    _id: string;
    title: string;
    city: string;
    country: string;
    images?: string[];
  };
  guestDetails?: {
    name?: string;
    email?: string;
  };
}

export default function HostBookings() {
  const { status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const fetchBookings = async () => {
      try {
        const params = new URLSearchParams();
        params.set('status', statusFilter);
        params.set('date', dateFilter);
        if (dateFilter === 'custom') {
          if (fromDate) params.set('from', fromDate);
          if (toDate) params.set('to', toDate);
        }
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        const res = await fetch(`/api/host/bookings?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const data = await res.json();
        setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
        setTotalPages(data?.pagination?.totalPages || 1);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [status, statusFilter, dateFilter, fromDate, toDate, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFilter, fromDate, toDate, pageSize]);

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
  };

  const statusStyles: Record<string, string> = {
    confirmed: 'bg-teal-50 text-teal-700',
    cancelled: 'bg-red-50 text-red-600',
    pending: 'bg-amber-50 text-amber-600',
    'checked-in': 'bg-blue-50 text-blue-600',
    completed: 'bg-gray-100 text-gray-600',
  };

  const handleUpdateStatus = async (
    bookingId: string,
    nextStatus: 'confirmed' | 'checked-in' | 'completed' | 'cancelled'
  ) => {
    try {
      const res = await fetch('/api/host/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to update booking');
      }

      setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, status: nextStatus } : b)));
    } catch (err: any) {
      setError(err.message || 'Failed to update booking');
    }
  };
  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50">Loading...</div>;
  }
  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You are not authorized to view this page.</p>
          <a href="/auth/login" className="text-teal-500 font-semibold hover:underline">Go to Login</a>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen bg-gray-50">
      <HostNavbar />
      <main className="flex-1 p-8 lg:p-10 ml-64">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 rounded-2xl border border-teal-100 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-teal-700">Bookings</h1>
            <p className="text-gray-500 text-sm font-medium">Manage upcoming and past stays</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-4 mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500">Status</label>
              <select
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked-in">Checked-in</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500">Date</label>
              <select
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {dateFilter === 'custom' ? (
              <div className="flex flex-wrap gap-2">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500">From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500">To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : null}
            <div className="flex flex-col">
              <label className="text-xs text-gray-500">Page size</label>
              <select
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="text-gray-500">Loading bookings...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="text-gray-500">No bookings yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col md:flex-row gap-4">
                {booking.property?.images?.[0] ? (
                  <img
                    src={booking.property.images[0]}
                    alt={booking.property.title || 'Property'}
                    className="w-full md:w-32 h-40 md:h-32 object-cover rounded-xl flex-shrink-0"
                  />
                ) : (
                  <div className="w-full md:w-32 h-40 md:h-32 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs flex-shrink-0">No Image</div>
                )}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{booking.property?.title || 'Unknown property'}</div>
                      <div className="text-sm text-gray-500">{booking.property?.city || '—'}, {booking.property?.country || '—'}</div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyles[(booking.status || 'confirmed').toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {booking.status || 'confirmed'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="text-gray-400 text-xs">Guest</div>
                      <div className="font-medium text-gray-800">{booking.guestDetails?.name || 'Guest'}</div>
                      <div className="text-gray-400 text-xs truncate">{booking.guestDetails?.email || ''}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="text-gray-400 text-xs">Dates</div>
                      <div className="font-medium text-gray-800">{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</div>
                      <div className="text-gray-400 text-xs">{booking.guests} guest{booking.guests === 1 ? '' : 's'}</div>
                    </div>
                    <div className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2">
                      <div className="text-gray-400 text-xs">Total</div>
                      <div className="text-teal-700 font-semibold">${booking.totalPrice || 0}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 sm:col-span-3">
                      <div className="text-gray-400 text-xs">Payment</div>
                      <div className={`font-semibold ${(booking.paymentStatus || 'unpaid').toLowerCase() === 'paid' ? 'text-green-700' : 'text-amber-700'}`}>
                        {(booking.paymentStatus || 'unpaid').toLowerCase() === 'paid' ? 'Paid' : 'Pending Payment'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                  {(() => {
                    const currentStatus = (booking.status || 'pending').toLowerCase();
                    const paymentStatus = (booking.paymentStatus || 'unpaid').toLowerCase();
                    const isPaid = paymentStatus === 'paid';
                    const checkInDate = new Date(booking.checkIn);
                    const checkOutDate = new Date(booking.checkOut);
                    const now = new Date();
                    const beforeCheckIn = !Number.isNaN(checkInDate.getTime()) && now < checkInDate;
                    const afterCheckIn = !Number.isNaN(checkInDate.getTime()) && now >= checkInDate;
                    const afterCheckOut = !Number.isNaN(checkOutDate.getTime()) && now >= checkOutDate;

                    const canConfirm = currentStatus === 'pending';
                    const canCheckIn = currentStatus === 'confirmed' && isPaid && afterCheckIn && !afterCheckOut;
                    const canComplete = currentStatus === 'checked-in' && afterCheckOut;
                    const canCancel = (currentStatus === 'pending' || currentStatus === 'confirmed') && beforeCheckIn;

                    return (
                      <>
                  <button
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-teal-200 text-teal-700 hover:bg-teal-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handleUpdateStatus(booking._id, 'confirmed')}
                        disabled={!canConfirm}
                  >
                    Confirm
                  </button>
                  <button
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={() => handleUpdateStatus(booking._id, 'checked-in')}
                        disabled={!canCheckIn}
                        title={!isPaid && currentStatus === 'confirmed' ? 'Guest payment required before check-in' : ''}
                  >
                        Check-in
                  </button>
                  <button
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={() => handleUpdateStatus(booking._id, 'completed')}
                        disabled={!canComplete}
                  >
                        Complete
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                        disabled={!canCancel}
                  >
                    Cancel
                  </button>
                      </>
                    );
                  })()}
                </div>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="text-sm text-gray-500">Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
