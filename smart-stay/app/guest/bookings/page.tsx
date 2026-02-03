"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { CalendarDays } from 'lucide-react';
import GuestNavbar from '@/components/navbar/GuestNavbar';

export default function GuestBookings() {
  const { status } = useSession();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      try {
        // Fetch bookings for the current user
        const res = await fetch('/api/guest/bookings');
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const data = await res.json();
        setBookings(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Your Bookings</h1>
          <p className="text-gray-500 text-base">View and manage your reservations</p>
        </div>
        {loading ? (
          <div className="text-gray-500 mt-10">Loading...</div>
        ) : error ? (
          <div className="text-red-500 mt-10">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="text-gray-500 mt-10">No bookings found.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {bookings.map((b) => (
              <div key={b._id} className="bg-white rounded-2xl shadow flex flex-col md:flex-row gap-6 p-6 items-center md:items-start relative">
                <div className="w-full md:w-60 h-44 relative flex-shrink-0">
                  {b.property?.images?.[0] ? (
                    <Image src={b.property.images[0]} alt={b.property.title} fill className="object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 rounded-xl">No Image</div>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{b.property?.title}</h2>
                    <span className="text-gray-500 text-sm">{b.property?.city}, {b.property?.country}</span>
                  </div>
                  <div className="flex gap-8 text-gray-600 text-sm mb-2">
                    <div className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Check-in <span className="ml-1 font-medium text-black">{formatDate(b.checkIn)}</span></div>
                    <div className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Check-out <span className="ml-1 font-medium text-black">{formatDate(b.checkOut)}</span></div>
                    <div>Duration <span className="font-medium text-black">{getNights(b.checkIn, b.checkOut)} nights</span></div>
                  </div>
                  <div className="text-gray-500 text-sm">Total Price</div>
                  <div className="text-2xl font-bold text-teal-600 mb-2">${b.totalPrice}</div>
                </div>
                <div className="absolute top-6 right-6">
                  <span className="bg-teal-100 text-teal-600 px-4 py-1 rounded-full text-sm font-semibold">Upcoming</span>
                </div>
                <div className="absolute bottom-6 right-6">
                  <button className="text-teal-600 font-semibold hover:underline">View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function getNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diff = outDate.getTime() - inDate.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}
