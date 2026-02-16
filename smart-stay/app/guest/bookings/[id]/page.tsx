"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import GuestNavbar from '@/components/navbar/GuestNavbar';
import { CalendarDays, Mail, ReceiptText, XCircle } from 'lucide-react';

type Booking = {
  _id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: string;
  pricePerNight?: number;
  cleaningFee?: number;
  serviceFee?: number;
  totalPrice?: number;
  createdAt?: string;
  cancelledAt?: string;
  property?: {
    _id: string;
    title: string;
    category?: string;
    address?: string;
    city?: string;
    country?: string;
    price?: number;
    images?: string[];
  };
  hostDetails?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
};

const CANCELLATION_CUTOFF_HOURS = 24;

export default function BookingDetails() {
  const { status } = useSession();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = params?.id as string | undefined;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const invoiceMode = searchParams.get('invoice') === '1';

  useEffect(() => {
    if (!bookingId) return;
    const fetchBooking = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/guest/bookings/${bookingId}`);
        if (!res.ok) throw new Error('Failed to fetch booking');
        const data = await res.json();
        setBooking(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const nights = useMemo(() => {
    if (!booking) return 0;
    return getNights(booking.checkIn, booking.checkOut);
  }, [booking]);

  const canCancel = useMemo(() => {
    if (!booking) return false;
    if (booking.status === 'cancelled') return false;
    const checkInDate = new Date(booking.checkIn);
    const today = new Date();
    const cutoffMs = CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;
    return checkInDate.getTime() - today.getTime() > cutoffMs;
  }, [booking]);

  const pricePerNight = booking?.pricePerNight ?? booking?.property?.price ?? 0;
  const cleaningFee = booking?.cleaningFee ?? 0;
  const serviceFee = booking?.serviceFee ?? 0;
  const totalPrice = booking?.totalPrice ?? pricePerNight * nights + cleaningFee + serviceFee;

  const handleDownloadInvoice = async () => {
    if (!booking) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('SmartStay - Booking Invoice', 14, 18);
    doc.setFontSize(11);
    doc.text(`Invoice ID: ${booking._id}`, 14, 28);
    doc.text(`Property: ${booking.property?.title || 'N/A'}`, 14, 36);
    doc.text(`Host: ${booking.hostDetails?.name || 'Host'}`, 14, 44);
    doc.text(`Check-in: ${formatDate(booking.checkIn)}`, 14, 52);
    doc.text(`Check-out: ${formatDate(booking.checkOut)}`, 14, 60);
    doc.text(`Guests: ${booking.guests}`, 14, 68);
    doc.text(`Status: ${booking.status}`, 14, 76);

    doc.setFontSize(12);
    doc.text('Price Breakdown', 14, 90);
    doc.setFontSize(11);
    doc.text(`${nights} nights x ${formatCurrency(pricePerNight)}: ${formatCurrency(pricePerNight * nights)}`, 14, 100);
    doc.text(`Cleaning fee: ${formatCurrency(cleaningFee)}`, 14, 108);
    doc.text(`Service fee: ${formatCurrency(serviceFee)}`, 14, 116);
    doc.text(`Total: ${formatCurrency(totalPrice)}`, 14, 124);

    doc.save(`invoice-${booking._id}.pdf`);
  };

  const handleCancel = async () => {
    if (!bookingId) return;
    setCancelError('');
    const confirmed = window.confirm('Cancel this booking?');
    if (!confirmed) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/guest/bookings/${bookingId}`, { method: 'PATCH' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel booking');
      }
      const data = await res.json();
      setBooking(data);
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
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
    <div className="flex min-h-screen">
      <GuestNavbar />
      <main className="flex-1 p-10 bg-gray-50 ml-64">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Booking Details</h1>
            <p className="text-gray-500 text-base">View property, dates, pricing, and actions.</p>
          </div>
          <button
            className="text-teal-600 font-semibold hover:underline"
            onClick={() => router.push('/guest/bookings')}
          >
            Back to bookings
          </button>
        </div>

        {loading ? (
          <div className="text-gray-500 mt-10">Loading...</div>
        ) : error ? (
          <div className="text-red-500 mt-10">{error}</div>
        ) : !booking ? (
          <div className="text-gray-500 mt-10">Booking not found.</div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-96 h-60 relative flex-shrink-0">
                {booking.property?.images?.[0] ? (
                  <Image src={booking.property.images[0]} alt={booking.property.title} fill className="object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 rounded-xl">No Image</div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">{booking.property?.title}</h2>
                  <div className="text-gray-500">{booking.property?.city}, {booking.property?.country}</div>
                  {booking.property?.category && (
                    <div className="text-xs text-teal-600 font-medium mt-1">
                      {booking.property.category.replace(/-/g, ' ')}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-6 text-gray-600 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Check-in
                    <span className="font-medium text-black">{formatDate(booking.checkIn)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Check-out
                    <span className="font-medium text-black">{formatDate(booking.checkOut)}</span>
                  </div>
                  <div>
                    Guests <span className="font-medium text-black">{booking.guests}</span>
                  </div>
                  <div>
                    Duration <span className="font-medium text-black">{nights} nights</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${booking.status === 'cancelled' ? 'bg-gray-100 text-gray-600' : 'bg-teal-100 text-teal-700'}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  <button
                    className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold"
                    onClick={() => router.push(`/guest/explore/${booking.property?._id}`)}
                  >
                    View Property
                  </button>
                  <button
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${booking.hostDetails?.email ? 'bg-white border border-teal-200 text-teal-700 hover:bg-teal-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    onClick={() => {
                      if (booking.hostDetails?.email) {
                        window.location.href = `mailto:${booking.hostDetails.email}`;
                      }
                    }}
                    disabled={!booking.hostDetails?.email}
                  >
                    <Mail className="h-4 w-4" /> Contact Host
                  </button>
                  <button
                    className="inline-flex items-center gap-2 bg-white border border-teal-200 text-teal-700 px-4 py-2 rounded-lg font-semibold hover:bg-teal-50"
                    onClick={() => router.push(`/guest/bookings/${bookingId}?invoice=1`)}
                  >
                    <ReceiptText className="h-4 w-4" /> View Invoice
                  </button>
                  <button
                    className="inline-flex items-center gap-2 bg-white border border-teal-200 text-teal-700 px-4 py-2 rounded-lg font-semibold hover:bg-teal-50"
                    onClick={handleDownloadInvoice}
                  >
                    <ReceiptText className="h-4 w-4" /> Download PDF
                  </button>
                  <button
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${canCancel ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    onClick={handleCancel}
                    disabled={!canCancel || cancelling}
                  >
                    <XCircle className="h-4 w-4" />
                    {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
                {cancelError && <div className="text-red-500 text-sm">{cancelError}</div>}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Price Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>{nights} nights × {formatCurrency(pricePerNight)}</span>
                  <span className="font-medium text-black">{formatCurrency(pricePerNight * nights)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cleaning fee</span>
                  <span className="font-medium text-black">{formatCurrency(cleaningFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service fee</span>
                  <span className="font-medium text-black">{formatCurrency(serviceFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-semibold text-teal-600">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>

            {invoiceMode && (
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Invoice</h3>
                  <button
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold"
                    onClick={() => window.print()}
                  >
                    Print Invoice
                  </button>
                </div>
                <div className="text-sm text-gray-600 flex flex-col gap-2">
                  <div>Booking ID: <span className="text-black font-medium">{booking._id}</span></div>
                  <div>Property: <span className="text-black font-medium">{booking.property?.title}</span></div>
                  <div>Host: <span className="text-black font-medium">{booking.hostDetails?.name || 'Host'}</span></div>
                  <div>Check-in: <span className="text-black font-medium">{formatDate(booking.checkIn)}</span></div>
                  <div>Check-out: <span className="text-black font-medium">{formatDate(booking.checkOut)}</span></div>
                  <div>Total: <span className="text-black font-medium">{formatCurrency(totalPrice)}</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function getNights(checkIn?: string, checkOut?: string) {
  if (!checkIn || !checkOut) return 0;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diff = outDate.getTime() - inDate.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}
