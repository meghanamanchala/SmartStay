"use client";

import React, { useEffect, useState } from 'react';
import HostNavbar from '@/components/navbar/HostNavbar';
import { Calendar, DollarSign, Star, Home } from 'lucide-react';


type Stat = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change: string;
};
type Booking = {
  property: string;
  location: string;
  guest: string;
  checkin: string;
  checkout: string;
  total: string;
  status: string;
};
type Property = {
  name: string;
  location: string;
  price: string;
  rating: number;
  image: string;
};

export default function HostDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      try {
        const res = await fetch('/api/host/dashboard');
        if (!res.ok) throw new Error('Unauthorized or forbidden');
        const data = await res.json();
        setDashboard(data);
      } catch (err) {
        setError('You are not authorized to view this dashboard.');
      }
      setLoading(false);
    }
    fetchDashboard();
  }, []);

  // Fallbacks for demo if API doesn't return real data yet
  const stats: Stat[] = dashboard?.stats || [
    { icon: <Home className="w-6 h-6 text-teal-500" />, label: 'Active Listings', value: 0, change: '+0' },
    { icon: <DollarSign className="w-6 h-6 text-teal-500" />, label: 'Total Earnings', value: '$0', change: '+0%' },
    { icon: <Calendar className="w-6 h-6 text-teal-500" />, label: 'Upcoming Bookings', value: 0, change: '+0' },
    { icon: <Star className="w-6 h-6 text-teal-500" />, label: 'Average Rating', value: 0, change: '+0' },
  ];
  const bookings: Booking[] = dashboard?.bookings || [];
  const properties: Property[] = dashboard?.properties || [];

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You are not authorized to view this dashboard.</p>
          <a href="/auth/login" className="text-teal-500 font-semibold hover:underline">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-sans bg-gradient-to-br from-teal-50 via-white to-teal-100">
      <HostNavbar />
      <main className="flex-1 p-10 bg-gray-50 ml-64">
        {/* ...existing code... */}
        {/* The rest of your dashboard UI remains unchanged */}
        {/* ...existing code... */}
      </main>
    </div>
  );
}
