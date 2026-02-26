"use client";

import GuestNavbar from "@/components/navbar/GuestNavbar";
import { useSession } from "next-auth/react";
import { Calendar, Heart, TrendingUp, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const RECENT_VIEWED_STORAGE_KEY_BASE = "guestRecentlyViewedPropertyIds";

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [recentViewedIds, setRecentViewedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const userIdentifier = session?.user?.email || (session?.user as { id?: string } | undefined)?.id || null;
  const recentViewedStorageKey = userIdentifier ? `${RECENT_VIEWED_STORAGE_KEY_BASE}:${userIdentifier}` : null;

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (status !== "authenticated" || !recentViewedStorageKey) {
      setRecentViewedIds([]);
      return;
    }

    try {
      const raw = window.localStorage.getItem(recentViewedStorageKey);
      if (!raw) {
        setRecentViewedIds([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentViewedIds(parsed.filter((id): id is string => typeof id === "string"));
      } else {
        setRecentViewedIds([]);
      }
    } catch {
      setRecentViewedIds([]);
    }
  }, [status, recentViewedStorageKey]);

  const fetchData = async () => {
    try {
      const [bookingsRes, propertiesRes] = await Promise.all([
        fetch("/api/guest/bookings"),
        fetch("/api/guest/properties"),
      ]);

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        setProperties(propertiesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingTrips = bookings.filter((b) => new Date(b.checkIn) > new Date()).length;

  const stats = [
    {
      icon: <Calendar className="w-7 h-7 text-teal-600" />,
      label: "Upcoming Trips",
      value: upcomingTrips,
    },
    {
      icon: <Heart className="w-7 h-7 text-rose-500" />,
      label: "Total Bookings",
      value: bookings.length,
    },
    {
      icon: <TrendingUp className="w-7 h-7 text-blue-600" />,
      label: "Properties Available",
      value: properties.length,
    },
  ];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const propertiesById = new Map(properties.map((property) => [property._id, property]));
  const recentProperties = recentViewedIds
    .map((propertyId) => propertiesById.get(propertyId))
    .filter((property): property is Property => Boolean(property))
    .slice(0, 4);
  const filteredProperties = normalizedSearch
    ? recentProperties.filter((p) => {
        const haystack = `${p.title} ${p.city} ${p.country}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : recentProperties;

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = normalizedSearch ? `?search=${encodeURIComponent(normalizedSearch)}` : "";
    router.push(`/guest/explore${query}`);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="rounded-2xl border border-gray-100 bg-white px-8 py-6 shadow-lg text-gray-600 font-medium">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You are not authorized to view this page.</p>
          <a href="/auth/login" className="text-teal-600 font-semibold hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      <GuestNavbar />
      <main className="flex-1 p-10 ml-64">
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            Welcome back <span className="text-black">👋</span>
          </h1>
          <p className="text-gray-600 font-medium">Ready to discover your next adventure?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex items-center gap-4 hover:shadow-xl transition"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                {stat.icon}
              </div>
              <div>
                <div className="text-3xl font-extrabold text-gray-800 leading-none">{stat.value}</div>
                <div className="text-gray-500 text-sm font-medium mt-1">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="font-bold text-lg mb-3 text-gray-800">Quick Search</div>
          <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3" onSubmit={handleSearchSubmit}>
            <div className="flex items-center flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 focus-within:ring-2 focus-within:ring-teal-200 focus-within:border-teal-400 transition">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Where do you want to go?"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-transparent outline-none flex-1 text-gray-700 placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold shadow hover:bg-teal-700 transition"
            >
              Explore
            </button>
          </form>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div className="font-bold text-xl text-gray-800">Recently Viewed</div>
          <Link href="/guest/explore" className="text-teal-600 font-semibold hover:underline text-sm">
            View all
          </Link>
        </div>

        {filteredProperties.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-3">
            {filteredProperties.map((p) => (
              <Link
                key={p._id}
                href={`/guest/explore/${p._id}`}
                className="bg-white rounded-2xl shadow-lg p-4 min-w-[270px] max-w-[270px] flex-shrink-0 border border-gray-100 hover:shadow-xl transition"
              >
                <img
                  src={p.images?.[0] || "https://via.placeholder.com/260x130"}
                  alt={p.title}
                  className="w-full h-36 object-cover rounded-xl mb-3 border border-gray-200"
                />
                <div className="font-bold text-base text-gray-800 line-clamp-1">{p.title}</div>
                <div className="text-gray-500 text-sm mb-1">
                  {p.city}, {p.country}
                </div>
                <div className="text-teal-600 font-semibold">${p.price}/night</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center">
            <p className="text-gray-700 font-semibold">
              {normalizedSearch
                ? "No recently viewed properties match your search."
                : "No recently viewed properties yet."}
            </p>
            <p className="text-gray-500 text-sm mt-1">Try a different location or check again later.</p>
          </div>
        )}
      </main>
    </div>
  );
}
