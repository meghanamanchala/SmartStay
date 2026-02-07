"use client";

import GuestNavbar from '@/components/navbar/GuestNavbar';
import { useSession } from 'next-auth/react';
import { Calendar, Heart, TrendingUp, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Booking {
  _id: string;
  checkIn: string;
  checkOut: string;
  property: {
    title: string;
    images: string[];
    city: string;
    country: string;
    price: number;
  };
}

interface Property {
  _id: string;
  title: string;
  images: string[];
  city: string;
  country: string;
  price: number;
}

export default function GuestDashboard() {
  const { status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [bookingsRes, propertiesRes] = await Promise.all([
        fetch('/api/guest/bookings'),
        fetch('/api/guest/properties'),
      ]);

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        // Set first 4 properties as recently viewed
        setProperties(propertiesData.slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingTrips = bookings.filter(
    (b) => new Date(b.checkIn) > new Date()
  ).length;

  const stats = [
    { icon: <Calendar className="w-7 h-7 text-teal-500" />, label: 'Upcoming Trips', value: upcomingTrips },
    { icon: <Heart className="w-7 h-7 text-teal-500" />, label: 'Total Bookings', value: bookings.length },
    { icon: <TrendingUp className="w-7 h-7 text-teal-500" />, label: 'Properties Available', value: properties.length },
  ];
  if (status === 'loading' || loading) {
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
    <div className="flex min-h-screen font-sans bg-gradient-to-br from-teal-50 via-white to-teal-100">
      <GuestNavbar />
      <main className="flex-1 p-10 bg-gray-50 ml-64">
        <div className="mb-2">
          <h1 className="text-3xl font-extrabold text-teal-700 mb-1 flex items-center gap-2">Welcome back! <span className="text-2xl">👋</span></h1>
          <p className="text-gray-500">Ready to discover your next adventure?</p>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl shadow p-6 flex items-center gap-4 border border-teal-50">
              <div>{stat.icon}</div>
              <div>
                <div className="text-2xl font-bold text-teal-700">{stat.value}</div>
                <div className="text-gray-500 text-md font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Quick Search */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8 border border-teal-50">
          <div className="font-bold text-lg mb-2 text-gray-700">Quick Search</div>
          <form className="flex items-center gap-3">
            <div className="flex items-center flex-1 bg-gray-100 rounded-lg px-4 py-3">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Where do you want to go?"
                className="bg-transparent outline-none flex-1 text-gray-700 text-md placeholder-gray-400"
              />
            </div>
            <button type="submit" className="px-6 py-3 rounded-lg bg-teal-500 text-white font-semibold shadow hover:bg-teal-600 transition text-md">
              Explore
            </button>
          </form>
        </div>
        {/* Recently Viewed */}
        <div className="mb-2 flex items-center justify-between">
          <div className="font-bold text-xl text-gray-700">Recently Viewed</div>
          <a href="/guest/explore" className="text-teal-500 font-semibold hover:underline text-sm">View all</a>
        </div>
        {properties.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-2">
            {properties.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-4 min-w-[260px] max-w-[260px] flex-shrink-0 border border-teal-50">
                <img
                  src={p.images?.[0] || 'https://via.placeholder.com/260x130'}
                  alt={p.title}
                  className="w-full h-32 object-cover rounded-lg mb-3 border"
                />
                <div className="font-bold text-md text-teal-700">{p.title}</div>
                <div className="text-gray-500 text-sm mb-1">{p.city}, {p.country}</div>
                <div className="text-teal-500 font-semibold text-md">${p.price}/night</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-500">
            No properties available at the moment.
          </div>
        )}
      </main>
    </div>
  );
}
