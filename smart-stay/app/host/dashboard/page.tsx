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
  ratingCount: number;
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
        const res = await fetch('/api/host/properties');
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

  // Map API stats to UI Stat[]
  const stats: Stat[] = dashboard?.stats
    ? [
        {
          icon: <Home className="w-7 h-7 text-teal-500" />,
          label: 'Active Listings',
          value: dashboard.stats.activeListings,
          change: '+0',
        },
        {
          icon: <DollarSign className="w-7 h-7 text-teal-500" />,
          label: 'Total Earnings',
          value: `$${dashboard.stats.totalEarnings}`,
          change: '+0%',
        },
        {
          icon: <Calendar className="w-7 h-7 text-teal-500" />,
          label: 'Upcoming Bookings',
          value: dashboard.stats.upcomingBookings,
          change: '+0',
        },
        {
          icon: <Star className="w-7 h-7 text-yellow-400" />,
          label: 'Average Rating',
          value: dashboard.stats.avgRating,
          change: '+0',
        },
      ]
    : [];

  // Map API recentBookings to Booking[]
  const bookings: Booking[] = dashboard?.stats?.recentBookings
    ? dashboard.stats.recentBookings.map((b: any) => ({
        property: b.propertyName || '',
        location: b.location || '',
        guest: b.guestName || '',
        checkin: b.checkIn ? new Date(b.checkIn).toLocaleDateString() : '',
        checkout: b.checkOut ? new Date(b.checkOut).toLocaleDateString() : '',
        total: b.amount ? `$${b.amount}` : '',
        status: b.status || '',
      }))
    : [];

  // Map API properties to Property[]
  const properties: Property[] = dashboard?.properties
    ? dashboard.properties.map((p: any) => ({
        name: p.name || '',
        location: p.location || '',
        price: p.price ? `$${p.price}` : '',
        rating: Number(p.rating || 0),
        ratingCount: Number(p.ratingCount || 0),
        image: p.images[0] || '/default-property.jpg',
      }))
    : [];

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

  function getStatusBadgeClass(status: string) {
    const normalized = status.toLowerCase();
    if (normalized === 'pending') return 'bg-amber-100 text-amber-700 border border-amber-200';
    if (normalized === 'confirmed') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    if (normalized === 'checked-in') return 'bg-sky-100 text-sky-700 border border-sky-200';
    if (normalized === 'completed') return 'bg-violet-100 text-violet-700 border border-violet-200';
    if (normalized === 'cancelled') return 'bg-rose-100 text-rose-700 border border-rose-200';
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <HostNavbar />
      <main className="flex-1 p-8 lg:p-10 ml-64">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2 rounded-2xl border border-teal-100 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-teal-700 mb-1 flex items-center gap-2">Host Dashboard <Home className="w-7 h-7 text-teal-500" /></h1>
            <p className="text-gray-500 font-medium">Manage your properties and track your earnings</p>
          </div>
          <a href="/host/add-property" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold shadow-sm hover:bg-teal-700 transition text-sm">
            <span className="text-xl">+</span> Add Property
          </a>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
          {stats.length === 0 ? (
            <div className="col-span-4 text-center text-gray-400">No stats available.</div>
          ) : (
            stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-start gap-2 border border-teal-100 p-6">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                    {stat.icon || statIcons[i]}
                  </div>
                  <span className="text-3xl font-extrabold text-teal-700 leading-none">{formatStatValue(stat.label, stat.value)}</span>
                </div>
                <div className="text-gray-600 text-sm font-semibold uppercase tracking-wide">{stat.label}</div>
                <div className="text-xs font-semibold mt-1 flex items-center gap-1">
                  {renderChange(stat.change)}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-teal-100 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-teal-700">Recent Bookings</h2>
              <a href="/host/bookings" className="text-teal-500 font-semibold hover:underline text-sm">View all</a>
            </div>
            <div className="flex flex-col gap-4">
              {bookings.length === 0 ? (
                <div className="text-gray-400 text-center">No bookings found.</div>
              ) : (
                bookings.map((b, i) => (
                  <div key={i} className="rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-white to-teal-50/40 hover:from-teal-50 hover:to-teal-100/40 transition border border-teal-100">
                    <div>
                      <div className="font-semibold text-lg text-gray-900 mb-0.5 leading-tight">{b.guest}</div>
                      <div className="text-gray-700 text-base mb-0.5 font-medium">
                        {b.property}
                        {b.location && <span className="text-gray-400 ml-1">{b.location}</span>}
                      </div>
                      <div className="text-gray-500 text-sm flex flex-wrap gap-x-4 gap-y-1 items-center">
                        <span>Check-in: <span className="font-medium text-gray-700">{b.checkin}</span></span>
                        <span>Check-out: <span className="font-medium text-gray-700">{b.checkout}</span></span>
                        {b.total && <span className="text-teal-600 font-bold">{b.total}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <span className={`px-3 py-1 rounded-full font-semibold text-xs capitalize ${getStatusBadgeClass(b.status)}`}>
                        {b.status || 'unknown'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Your Properties */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-teal-100 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-teal-700">Your Properties</h2>
              <a href="/host/properties" className="text-teal-500 font-semibold hover:underline text-sm">View all</a>
            </div>
            <div className="flex flex-col gap-4">
              {properties.length === 0 ? (
                <div className="text-gray-400 text-center">No properties found.</div>
              ) : (
                properties.map((p, i) => (
                  <div key={i} className="rounded-xl px-4 py-3 flex items-center gap-4 border border-teal-100 bg-gradient-to-r from-white to-teal-50/40 hover:from-teal-50 hover:to-teal-100/40 transition">
                    <img src={p.image} alt={p.name} className="w-16 h-12 object-cover rounded-lg border border-teal-100" />
                    <div className="flex-1">
                      <div className="font-bold text-md text-teal-700 leading-tight">{p.name}</div>
                      <div className="text-gray-500 text-xs mb-0.5">{p.location}</div>
                      <div className="text-teal-600 font-semibold text-xs">{p.price}</div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-100">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs font-bold text-gray-700">{p.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-gray-500">({p.ratingCount})</span>
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
