"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import GuestNavbar from '@/components/navbar/GuestNavbar';
import { CalendarDays, Mail, ReceiptText, XCircle, CheckCircle2, Clock, HomeIcon, Star } from 'lucide-react';

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
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState(false);

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
    if (booking.status === 'cancelled' || booking.status === 'checked-in' || booking.status === 'completed') return false;
    const checkInDate = parseDate(booking.checkIn);
    if (!checkInDate) return false;
    const today = new Date();
    const cutoffMs = CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;
    return checkInDate.getTime() - today.getTime() > cutoffMs;
  }, [booking]);

  const pricePerNight = booking?.pricePerNight ?? booking?.property?.price ?? 0;
  const cleaningFee = booking?.cleaningFee ?? 0;
  const serviceFee = booking?.serviceFee ?? 0;
  const totalPrice = booking?.totalPrice ?? pricePerNight * nights + cleaningFee + serviceFee;

  const statusConfig = useMemo(() => {
    if (!booking) return null;
    const status = booking.status?.toLowerCase() || '';
    
    const configs: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
      pending: {
        label: 'Pending Confirmation',
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        icon: <Clock className="h-4 w-4" />
      },
      confirmed: {
        label: 'Confirmed',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        icon: <CheckCircle2 className="h-4 w-4" />
      },
      'checked-in': {
        label: 'Checked In',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        icon: <HomeIcon className="h-4 w-4" />
      },
      completed: {
        label: 'Completed',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: <Star className="h-4 w-4" />
      },
      cancelled: {
        label: 'Cancelled',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
        icon: <XCircle className="h-4 w-4" />
      }
    };
    
    return configs[status] || {
      label: status,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: null
    };
  }, [booking]);

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

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      setMessageError('Please enter a message');
      return;
    }
    if (!booking?.hostDetails?.email) {
      setMessageError('Host contact information not available');
      return;
    }

    setMessageError('');
    setSendingMessage(true);

    try {
      const res = await fetch('/api/guest/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: booking.hostDetails.email,
          subject: `Message about ${booking.property?.title}`,
          message: messageText,
          bookingId: booking._id,
          propertyId: booking.property?._id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setMessageSuccess(true);
      setMessageText('');
      
      setTimeout(() => {
        setShowMessageModal(false);
        setMessageSuccess(false);
      }, 2000);
    } catch (err: any) {
      setMessageError(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      <GuestNavbar />
      <main className="flex-1 p-10 ml-64">
        <div className="mb-8 flex items-center justify-between bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div>
            <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">Booking Details</h1>
            <p className="text-gray-600 text-base font-medium">View property information, dates, pricing, and manage your booking.</p>
          </div>
          <button
            className="text-teal-600 font-bold hover:text-teal-700 hover:underline flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-teal-50 transition-all duration-200"
            onClick={() => router.push('/guest/bookings')}
          >
            ← Back to bookings
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading booking details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center max-w-md shadow-lg">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Booking</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : !booking ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 text-center max-w-md shadow-lg">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Booking Not Found</h3>
              <p className="text-gray-600">The booking you're looking for doesn't exist.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Status Timeline */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-xl font-bold mb-8 text-gray-800">Booking Status</h3>
              
              {/* Status Badge */}
              <div className="flex items-center justify-center mb-10">
                <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold shadow-md border-2 transition-all duration-300 ${statusConfig?.bgColor} ${statusConfig?.color} border-current hover:scale-105`}>
                  <div className="scale-110">{statusConfig?.icon}</div>
                  {statusConfig?.label}
                </div>
              </div>

              {/* Timeline */}
              <div className="relative px-4 py-6">
                <div className="flex items-start justify-between max-w-4xl mx-auto">
                  {/* Pending */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-4 ${
                      booking.status === 'pending' ? 'bg-amber-500 text-white border-amber-200 shadow-amber-300 scale-110' : 
                      booking.status === 'cancelled' ? 'bg-gray-200 text-gray-400 border-gray-100' :
                      'bg-teal-500 text-white border-teal-200 shadow-teal-300'
                    }`}>
                      <Clock className="h-6 w-6" />
                    </div>
                    <div className={`text-sm font-semibold mt-3 text-center ${
                      booking.status === 'pending' ? 'text-amber-700' : 
                      booking.status === 'cancelled' ? 'text-gray-400' :
                      'text-teal-700'
                    }`}>Pending</div>
                    <div className="text-xs text-gray-500 mt-1 text-center hidden sm:block">Awaiting host</div>
                  </div>

                  {/* Connector 1 */}
                  <div className={`flex-1 h-2 mx-4 mt-6 rounded-full transition-all duration-500 ${
                    booking.status === 'cancelled' ? 'bg-gray-200' :
                    booking.status === 'pending' ? 'bg-gray-200' : 
                    'bg-gradient-to-r from-teal-500 to-blue-500'
                  }`} />

                  {/* Confirmed */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-4 ${
                      booking.status === 'pending' ? 'bg-gray-200 text-gray-400 border-gray-100' :
                      booking.status === 'confirmed' ? 'bg-blue-500 text-white border-blue-200 shadow-blue-300 scale-110' :
                      booking.status === 'cancelled' ? 'bg-gray-200 text-gray-400 border-gray-100' :
                      'bg-teal-500 text-white border-teal-200 shadow-teal-300'
                    }`}>
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className={`text-sm font-semibold mt-3 text-center ${
                      booking.status === 'confirmed' ? 'text-blue-700' : 
                      booking.status === 'pending' || booking.status === 'cancelled' ? 'text-gray-400' :
                      'text-teal-700'
                    }`}>Confirmed</div>
                    <div className="text-xs text-gray-500 mt-1 text-center hidden sm:block">Ready to go</div>
                  </div>

                  {/* Connector 2 */}
                  <div className={`flex-1 h-2 mx-4 mt-6 rounded-full transition-all duration-500 ${
                    booking.status === 'cancelled' ? 'bg-gray-200' :
                    booking.status === 'pending' || booking.status === 'confirmed' ? 'bg-gray-200' : 
                    'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`} />

                  {/* Checked In */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-4 ${
                      booking.status === 'checked-in' ? 'bg-purple-500 text-white border-purple-200 shadow-purple-300 scale-110' :
                      booking.status === 'completed' ? 'bg-teal-500 text-white border-teal-200 shadow-teal-300' :
                      'bg-gray-200 text-gray-400 border-gray-100'
                    }`}>
                      <HomeIcon className="h-6 w-6" />
                    </div>
                    <div className={`text-sm font-semibold mt-3 text-center ${
                      booking.status === 'checked-in' ? 'text-purple-700' : 
                      booking.status === 'completed' ? 'text-teal-700' :
                      'text-gray-400'
                    }`}>Checked In</div>
                    <div className="text-xs text-gray-500 mt-1 text-center hidden sm:block">Enjoying stay</div>
                  </div>

                  {/* Connector 3 */}
                  <div className={`flex-1 h-2 mx-4 mt-6 rounded-full transition-all duration-500 ${
                    booking.status === 'completed' ? 'bg-gradient-to-r from-purple-500 to-green-500' : 'bg-gray-200'
                  }`} />

                  {/* Completed */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-4 ${
                      booking.status === 'completed' ? 'bg-green-500 text-white border-green-200 shadow-green-300 scale-110' : 'bg-gray-200 text-gray-400 border-gray-100'
                    }`}>
                      <Star className="h-6 w-6" />
                    </div>
                    <div className={`text-sm font-semibold mt-3 text-center ${
                      booking.status === 'completed' ? 'text-green-700' : 'text-gray-400'
                    }`}>Completed</div>
                    <div className="text-xs text-gray-500 mt-1 text-center hidden sm:block">Trip finished</div>
                  </div>
                </div>

                {/* Cancelled Indicator */}
                {booking.status === 'cancelled' && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-red-50 rounded-xl border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 text-gray-800">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <span className="font-bold text-lg">This booking was cancelled</span>
                        {booking.cancelledAt && (
                          <div className="text-sm text-gray-600 mt-1">
                            Cancelled on {formatDate(booking.cancelledAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col lg:flex-row gap-6 border border-gray-100">
              <div className="w-full lg:w-96 h-60 relative flex-shrink-0 group">
                {booking.property?.images?.[0] ? (
                  <Image src={booking.property.images[0]} alt={booking.property.title} fill className="object-cover rounded-xl transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400 rounded-xl font-medium">No Image</div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{booking.property?.title}</h2>
                  <div className="text-gray-600 font-medium mt-1">{booking.property?.city}, {booking.property?.country}</div>
                  {booking.property?.category && (
                    <div className="inline-block text-xs text-teal-700 bg-teal-50 font-semibold mt-2 px-3 py-1 rounded-full border border-teal-200">
                      {booking.property.category.replace(/-/g, ' ')}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-6 text-gray-700 text-sm">
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                    <CalendarDays className="h-4 w-4 text-teal-600" /> 
                    <span className="text-gray-500">Check-in</span>
                    <span className="font-bold text-gray-900">{formatDate(booking.checkIn)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                    <CalendarDays className="h-4 w-4 text-teal-600" /> 
                    <span className="text-gray-500">Check-out</span>
                    <span className="font-bold text-gray-900">{formatDate(booking.checkOut)}</span>
                  </div>
                  <div className="bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="text-gray-500">Guests</span> <span className="font-bold text-gray-900">{booking.guests}</span>
                  </div>
                  <div className="bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="text-gray-500">Duration</span> <span className="font-bold text-gray-900">{nights} nights</span>
                  </div>
                </div>

                {/* Action Buttons Grid */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Primary Action */}
                    <button
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 md:col-span-3"
                      onClick={() => router.push(`/guest/explore/${booking.property?._id}`)}
                    >
                      <HomeIcon className="h-5 w-5" />
                      View Property Details
                    </button>

                    {/* Secondary Actions */}
                    <button
                      className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${booking.hostDetails?.email ? 'bg-white border-2 border-teal-400 text-teal-700 hover:bg-teal-50 shadow-sm hover:shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200'}`}
                      onClick={() => setShowMessageModal(true)}
                      disabled={!booking.hostDetails?.email}
                    >
                      <Mail className="h-5 w-5" />
                      Contact Host
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 bg-white border-2 border-blue-400 text-blue-700 px-4 py-3 rounded-xl font-semibold hover:bg-blue-50 shadow-sm hover:shadow-md transition-all duration-200"
                      onClick={() => router.push(`/guest/bookings/${bookingId}?invoice=1`)}
                    >
                      <ReceiptText className="h-5 w-5" />
                      View Invoice
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 bg-white border-2 border-purple-400 text-purple-700 px-4 py-3 rounded-xl font-semibold hover:bg-purple-50 shadow-sm hover:shadow-md transition-all duration-200"
                      onClick={handleDownloadInvoice}
                    >
                      <ReceiptText className="h-5 w-5" />
                      Download PDF
                    </button>
                  </div>

                  {/* Danger Zone */}
                  {(booking.status !== 'cancelled' && booking.status !== 'completed') && (
                    <div className="mt-4">
                      <button
                        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${canCancel ? 'bg-red-50 text-red-700 border-2 border-red-400 hover:bg-red-100 shadow-sm hover:shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200'}`}
                        onClick={handleCancel}
                        disabled={!canCancel || cancelling}
                      >
                        <XCircle className="h-5 w-5" />
                        {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                      {cancelError && (
                        <div className="mt-3 text-red-700 text-sm bg-red-50 px-4 py-3 rounded-xl border-2 border-red-200 font-medium flex items-center gap-2">
                          <XCircle className="h-4 w-4 flex-shrink-0" />
                          {cancelError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-teal-50 rounded-2xl shadow-lg p-6 border border-teal-100">
              <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-teal-600" />
                Price Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <span className="text-gray-600 font-medium">{nights} nights × {formatCurrency(pricePerNight)}</span>
                  <span className="font-bold text-gray-900 text-base">{formatCurrency(pricePerNight * nights)}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <span className="text-gray-600 font-medium">Cleaning fee</span>
                  <span className="font-bold text-gray-900 text-base">{formatCurrency(cleaningFee)}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <span className="text-gray-600 font-medium">Service fee</span>
                  <span className="font-bold text-gray-900 text-base">{formatCurrency(serviceFee)}</span>
                </div>
                <div className="flex justify-between items-center bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 rounded-lg shadow-md">
                  <span className="font-bold text-base">Total</span>
                  <span className="font-extrabold text-xl">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>

            {invoiceMode && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 relative">
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
                  onClick={() => router.push(`/guest/bookings/${bookingId}`)}
                  title="Close invoice"
                >
                  <XCircle className="h-6 w-6" />
                </button>
                <div className="flex items-center justify-between mb-6 pr-12">
                  <h3 className="text-xl font-bold text-gray-800">Invoice Details</h3>
                  <button
                    className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={() => window.print()}
                  >
                    Print Invoice
                  </button>
                </div>
                <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">Booking ID</span>
                    <div className="text-gray-900 font-mono font-semibold mt-1">{booking._id}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">Property</span>
                    <div className="text-gray-900 font-semibold mt-1">{booking.property?.title}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">Host</span>
                    <div className="text-gray-900 font-semibold mt-1">{booking.hostDetails?.name || 'Host'}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">Check-in</span>
                    <div className="text-gray-900 font-semibold mt-1">{formatDate(booking.checkIn)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-gray-500 text-xs uppercase tracking-wide">Check-out</span>
                    <div className="text-gray-900 font-semibold mt-1">{formatDate(booking.checkOut)}</div>
                  </div>
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 rounded-lg">
                    <span className="text-teal-100 text-xs uppercase tracking-wide">Total Amount</span>
                    <div className="text-white font-bold text-lg mt-1">{formatCurrency(totalPrice)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message Modal */}
        {showMessageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-fade-in">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => {
                  setShowMessageModal(false);
                  setMessageError('');
                  setMessageSuccess(false);
                }}
              >
                <XCircle className="h-6 w-6" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Host</h2>
                <p className="text-gray-600">
                  Send a message to <span className="font-semibold text-teal-700">{booking?.hostDetails?.name || 'the host'}</span> about your booking
                </p>
              </div>

              {messageSuccess ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
                  <p className="text-green-700">The host will receive your message and respond to you via email.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="text-sm text-gray-700">
                      <div className="font-semibold text-teal-800 mb-1">Booking Details:</div>
                      <div className="text-gray-600">
                        {booking?.property?.title} • {formatDate(booking?.checkIn)} - {formatDate(booking?.checkOut)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Message
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-teal-500 focus:outline-none resize-none transition-colors"
                      rows={6}
                      placeholder="Type your message here... (e.g., questions about check-in, special requests, etc.)"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={sendingMessage}
                    />
                  </div>

                  {messageError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {messageError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                      onClick={() => {
                        setShowMessageModal(false);
                        setMessageError('');
                        setMessageText('');
                      }}
                      disabled={sendingMessage}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !messageText.trim()}
                    >
                      {sendingMessage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function parseDate(value?: string) {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const parsed = new Date(year, month, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(dateStr?: string) {
  const d = parseDate(dateStr);
  if (!d) return '';
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function getNights(checkIn?: string, checkOut?: string) {
  const inDate = parseDate(checkIn);
  const outDate = parseDate(checkOut);
  if (!inDate || !outDate) return 0;
  const diff = outDate.getTime() - inDate.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}
