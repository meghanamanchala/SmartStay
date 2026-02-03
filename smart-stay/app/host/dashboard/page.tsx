"use client";

import React, { useEffect, useState } from 'react';
import HostNavbar from '@/components/navbar/HostNavbar';
import { Calendar, DollarSign, Star, Home } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';


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
  function renderChange(change: string) {
    const numeric = parseFloat(change.replace(/[^0-9.-]+/g, ''));
    if (isNaN(numeric) || numeric === 0) {
      return <span className="text-gray-400 flex items-center gap-1"><ArrowUpRight className="inline w-4 h-4 text-gray-300" />{change}</span>;
    }
    if (numeric > 0) {
      return <span className="text-green-500 flex items-center gap-1"><ArrowUpRight className="inline w-4 h-4" />{change}</span>;
    }
    return <span className="text-red-500 flex items-center gap-1"><ArrowDownRight className="inline w-4 h-4" />{change}</span>;
  }
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

  const stats: Stat[] = dashboard?.stats || [];
  const bookings: Booking[] = dashboard?.bookings || [];
  const properties: Property[] = dashboard?.properties || [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-teal-600 text-xl font-semibold animate-pulse">Loading dashboard...</div>
      </div>
    );
  }
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
  if (!dashboard) {
    return null;
  }

  // Map stats to the correct Lucide icons and layout
  const statIcons = [
    <Home className="w-7 h-7 text-teal-500" />,
    <DollarSign className="w-7 h-7 text-teal-500" />,
    <Calendar className="w-7 h-7 text-teal-500" />,
    <Star className="w-7 h-7 text-yellow-400" />,
  ];

  function formatStatValue(label: string, value: string | number) {
    if (label === 'Total Earnings') {
      return typeof value === 'string' ? value.replace(/\$/g, '') : value;
    }
    return value;
  }
  return (
    <div className="flex min-h-screen font-sans bg-gradient-to-br from-teal-50 via-white to-teal-100">
      <HostNavbar />
      <main className="flex-1 p-10 bg-gray-50 ml-64">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-extrabold text-teal-700 mb-1 flex items-center gap-2">Host Dashboard <Home className="w-7 h-7 text-teal-500" /></h1>
            <p className="text-gray-500">Manage your properties and track your earnings</p>
          </div>
          <a href="/host/add-property" className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-500 text-white font-semibold shadow hover:bg-teal-600 transition text-md">
            <span className="text-xl">+</span> Add Property
          </a>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
          {stats.length === 0 ? (
            <div className="col-span-4 text-center text-gray-400">No stats available.</div>
          ) : (
            stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl shadow flex flex-col items-start gap-2 border border-teal-50 p-6">
                <div className="flex items-center gap-3 mb-2">
                  {statIcons[i]}
                  <span className="text-3xl font-extrabold text-teal-700">{formatStatValue(stat.label, stat.value)}</span>
                </div>
                <div className="text-gray-500 text-base font-semibold">{stat.label}</div>
                <div className="text-xs font-semibold mt-1 flex items-center gap-1">
                  {renderChange(stat.change)}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl shadow p-6 border border-teal-50 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-teal-700">Recent Bookings</h2>
              <a href="/host/bookings" className="text-teal-500 font-semibold hover:underline text-sm">View all</a>
            </div>
            <div className="flex flex-col gap-4">
              {bookings.length === 0 ? (
                <div className="text-gray-400 text-center">No bookings found.</div>
              ) : (
                bookings.map((b, i) => (
                  <div key={i} className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-teal-50 transition">
                    <div>
                      <div className="font-bold text-md text-gray-800 mb-0.5">{b.guest}</div>
                      <div className="text-gray-700 text-sm mb-0.5">{b.property}</div>
                      <div className="text-gray-500 text-xs">Check-in: {b.checkin}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      {b.status === 'Pending' && (
                        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-600 font-semibold text-xs">pending</span>
                      )}
                      {b.status === 'Confirmed' && (
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 font-semibold text-xs">confirmed</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Your Properties */}
          <div className="bg-white rounded-2xl shadow p-6 border border-teal-50 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-teal-700">Your Properties</h2>
              <a href="/host/properties" className="text-teal-500 font-semibold hover:underline text-sm">View all</a>
            </div>
            <div className="flex flex-col gap-4">
              {properties.length === 0 ? (
                <div className="text-gray-400 text-center">No properties found.</div>
              ) : (
                properties.map((p, i) => (
                  <div key={i} className="rounded-xl px-4 py-3 flex items-center gap-4 hover:bg-teal-50 transition">
                    <img src={p.image} alt={p.name} className="w-16 h-12 object-cover rounded-lg border" />
                    <div className="flex-1">
                      <div className="font-bold text-md text-teal-700">{p.name}</div>
                      <div className="text-gray-500 text-xs mb-0.5">{p.location}</div>
                      <div className="text-teal-500 font-semibold text-xs">{p.price}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs font-bold text-gray-700">{p.rating}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
