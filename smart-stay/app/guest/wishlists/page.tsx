"use client";

import GuestNavbar from "@/components/navbar/GuestNavbar";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Heart, ChevronDown } from "lucide-react";

interface Property {
  _id: string;
  title: string;
  city: string;
  country: string;
  price: number;
  images: string[];
  host: string;
  avgRating?: number;
  reviewCount?: number;
  createdAt?: string;
}

type SortOption =
  | "price-low"
  | "price-high"
  | "rating-high"
  | "rating-low"
  | "date-newest"
  | "date-oldest";

export default function GuestWishlists() {
  const { status } = useSession();
  const [wishlists, setWishlists] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("price-low");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchWishlists() {
      setLoading(true);

      let likedPropertyIds: string[] = [];
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("likedProperties");
        if (local) {
          likedPropertyIds = JSON.parse(local);
        } else {
          const likedRes = await fetch("/api/guest/profile");
          const likedData = await likedRes.json();
          likedPropertyIds = likedData?.likedProperties || [];
        }
      }

      if (!likedPropertyIds.length) {
        setWishlists([]);
        setLoading(false);
        return;
      }

      const propRes = await fetch("/api/guest/properties");
      const allProperties = await propRes.json();
      const filtered = (Array.isArray(allProperties) ? allProperties : []).filter((p: Property) =>
        likedPropertyIds.includes(p._id)
      );

      setWishlists(filtered);
      setLoading(false);
    }

    fetchWishlists();

    const onStorage = () => fetchWishlists();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="rounded-2xl border border-gray-100 bg-white px-8 py-6 shadow-lg text-gray-600 font-medium">
          Loading wishlists...
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

  function handleRemoveFromWishlist(propertyId: string): void {
    const confirmed = window.confirm("Are you sure you want to remove this property from your wishlist?");
    if (!confirmed) return;

    let likedPropertyIds: string[] = [];
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("likedProperties");
      if (local) likedPropertyIds = JSON.parse(local);
    }

    const updated = likedPropertyIds.filter((id) => id !== propertyId);
    localStorage.setItem("likedProperties", JSON.stringify(updated));
    setWishlists((prev) => prev.filter((p) => p._id !== propertyId));

    fetch("/api/guest/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ likedProperties: updated }),
    });
  }

  const getSortedWishlists = () => {
    const sorted = [...wishlists];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      case "rating-high":
        return sorted.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
      case "rating-low":
        return sorted.sort((a, b) => (a.avgRating || 0) - (b.avgRating || 0));
      case "date-newest":
        return sorted.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      case "date-oldest":
        return sorted.sort(
          (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
      default:
        return sorted;
    }
  };

  const sortOptions = [
    { label: "Price: Low to High", value: "price-low" as SortOption },
    { label: "Price: High to Low", value: "price-high" as SortOption },
    { label: "Rating: Highest First", value: "rating-high" as SortOption },
    { label: "Rating: Lowest First", value: "rating-low" as SortOption },
    { label: "Date: Newest First", value: "date-newest" as SortOption },
    { label: "Date: Oldest First", value: "date-oldest" as SortOption },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <GuestNavbar />
      <main className="flex-1 p-6 md:p-10 ml-0 md:ml-64">
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold mb-1 text-teal-600">
                Your Wishlists
              </h1>
              <p className="text-gray-600 font-medium">Properties you saved for later</p>
            </div>
            <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700 w-fit">
              {wishlists.length} saved
            </span>
          </div>
        </div>

        {!loading && wishlists.length > 0 && (
          <div className="mb-6 flex justify-end" ref={sortRef}>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm font-medium text-gray-700"
              >
                <span>Sort: {sortOptions.find((opt) => opt.value === sortBy)?.label}</span>
                <ChevronDown size={18} className={`transition ${showSortMenu ? "rotate-180" : ""}`} />
              </button>

              {showSortMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition ${sortBy === option.value ? "bg-teal-50 text-teal-700 font-semibold" : "text-gray-700"
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-8 shadow text-gray-500">
            Loading wishlists...
          </div>
        ) : wishlists.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 shadow-lg">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 text-lg font-semibold">No wishlisted properties yet.</p>
            <p className="text-gray-400 text-sm mt-1">Start adding properties to your wishlist.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {getSortedWishlists().map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition overflow-hidden flex flex-col"
              >
                <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={item.images?.[0] || "/placeholder.jpg"}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  />
                  <button
                    className="absolute top-3 right-3 bg-white rounded-full p-2 shadow hover:bg-gray-50 transition"
                    aria-label="Remove from wishlist"
                    onClick={() => handleRemoveFromWishlist(item._id)}
                    title="Remove from wishlist"
                  >
                    <Heart className="h-5 w-5 fill-red-500 text-red-500" fill="red" />
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">{item.title}</h2>
                  <p className="text-gray-500 text-sm mb-3">
                    {item.city}, {item.country}
                  </p>

                  {typeof item.avgRating === "number" && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-amber-500 font-bold">★ {item.avgRating.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({item.reviewCount || 0} reviews)</span>
                    </div>
                  )}

                  <div className="mt-auto">
                    <span className="text-teal-600 font-bold text-lg">${item.price}</span>
                    <span className="text-gray-500 text-sm">/night</span>
                  </div>

                  <button
                    className="mt-4 w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition"
                    onClick={() => (window.location.href = `/guest/explore/${item._id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
