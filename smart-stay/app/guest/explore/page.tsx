"use client";
import { useSession } from "next-auth/react";

import GuestNavbar from "@/components/navbar/GuestNavbar";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Heart, ChevronDown, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type SmartFilters = {
  location?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minGuests?: number;
  amenities?: string[];
  keywords?: string[];
};

export default function GuestExplore() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GuestExploreContent />
    </Suspense>
  );
}

function GuestExploreContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [liked, setLiked] = useState<string[]>([]);

  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartResults, setSmartResults] = useState<any[] | null>(null);
  const [smartFilters, setSmartFilters] = useState<SmartFilters | null>(null);
  const latestSmartQueryRef = useRef("");

  const amenities = ["WiFi", "Pool", "Kitchen", "Parking", "AC", "Heating", "Washer", "Dryer", "TV", "Gym"];

  useEffect(() => {
    const querySearch = searchParams.get("search") || "";
    setSearch(querySearch);
  }, [searchParams]);

  useEffect(() => {
    const local = typeof window !== "undefined" ? localStorage.getItem("likedProperties") : null;
    if (local) {
      setLiked(JSON.parse(local));
    } else {
      async function fetchLiked() {
        const res = await fetch("/api/guest/profile");
        if (res.ok) {
          const data = await res.json();
          setLiked(data?.likedProperties || []);
          localStorage.setItem("likedProperties", JSON.stringify(data?.likedProperties || []));
        }
      }
      fetchLiked();
    }
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch("/api/guest/properties");
        if (!res.ok) throw new Error("Failed to fetch properties");
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

   useEffect(() => {
    const query = search.trim();

    if (!query) {
      setSmartResults(null);
      setSmartFilters(null);
      return;
    }

    const isNaturalLanguageQuery =
      /\b(in|near|under|over|between|with|for|around)\b/i.test(query) || query.split(/\s+/).length >= 3;

    if (!isNaturalLanguageQuery) {
      setSmartResults(null);
      setSmartFilters(null);
      return;
    }

    const timeout = setTimeout(() => {
      runSmartSearch(query);
    }, 450);

    return () => clearTimeout(timeout);
  }, [search]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="rounded-2xl border border-gray-100 bg-white px-8 py-6 shadow-lg text-gray-600 font-medium">
          Loading...
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

  const toggleWishlist = async (propertyId: string) => {
    let updated: string[];
    if (liked.includes(propertyId)) {
      updated = liked.filter((id) => id !== propertyId);
    } else {
      updated = [...liked, propertyId];
    }
    setLiked(updated);
    localStorage.setItem("likedProperties", JSON.stringify(updated));
    await fetch("/api/guest/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ likedProperties: updated }),
    });
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) => (prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]));
  };

  const isDateRangeValid = () => {
    if (!checkInDate || !checkOutDate) return true;
    return new Date(checkInDate) < new Date(checkOutDate);
  };

  const isSmartMode = smartResults !== null;
  const displayedProperties = smartResults ?? properties;
  const displayedFiltered = displayedProperties.filter((p) => {
    const matchesSearch = isSmartMode
      ? true
      : p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.city?.toLowerCase().includes(search.toLowerCase()) ||
        p.country?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter ? p.category === filter : true;
    const matchesPrice = p.price >= priceRange.min && p.price <= priceRange.max;
    const matchesAmenities =
      selectedAmenities.length === 0 ||
      selectedAmenities.every((amenity) => p.amenities?.some((a: string) => a.toLowerCase().includes(amenity.toLowerCase())));

    return matchesSearch && matchesFilter && matchesPrice && matchesAmenities;
  });

  const runSmartSearch = async (queryInput?: string) => {
    const query = (queryInput ?? search).trim();
    if (!query) return;

    latestSmartQueryRef.current = query;
    setSmartLoading(true);
    try {
      const res = await fetch("/api/guest/smart-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Smart search failed");
      }

      const data = await res.json();

      if (latestSmartQueryRef.current !== query) return;

      setSmartResults(Array.isArray(data.properties) ? data.properties : []);
      setSmartFilters(data.filters || null);
      setError("");
    } catch (err: any) {
      setError(err.message || "Smart search failed");
    } finally {
      setSmartLoading(false);
    }
  };

 

  const clearAllFilters = () => {
    setSearch(""); // important
    setCheckInDate("");
    setCheckOutDate("");
    setPriceRange({ min: 0, max: 10000 });
    setSelectedAmenities([]);
    setFilter("");
    setShowFilters(false);
    setSmartResults(null);
    setSmartFilters(null);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      <GuestNavbar />
      <main className="flex-1 p-10 ml-64">
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            Explore Properties
          </h1>
          <p className="text-gray-600 font-medium">Find your next perfect stay</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-teal-200 focus-within:border-teal-400">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder='Search by location/property OR try natural language: "beach house in goa under $200 with pool"'
              className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSmartSearch();
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => runSmartSearch()}
            disabled={smartLoading || !search.trim()}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition disabled:opacity-60 hover:cursor-pointer"
          >
            <Sparkles size={18} />
            {smartLoading ? "Searching..." : "Smart Search"}
          </button>
          {smartResults && (
            <button
              type="button"
              onClick={() => {
                setSmartResults(null);
                setSmartFilters(null);
              }}
              className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition hover:cursor-pointer"
            >
              Clear Smart
            </button>
          )}
          <button
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium text-gray-700 shadow-sm hover:cursor-pointer"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
            <ChevronDown size={18} className={`transition ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {smartFilters && (
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {smartFilters.location && <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full">Location: {smartFilters.location}</span>}
            {smartFilters.category && <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full">Type: {smartFilters.category}</span>}
            {typeof smartFilters.minPrice === "number" && <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full">Min: ${smartFilters.minPrice}</span>}
            {typeof smartFilters.maxPrice === "number" && <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full">Max: ${smartFilters.maxPrice}</span>}
            {typeof smartFilters.minGuests === "number" && <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full">Guests: {smartFilters.minGuests}+</span>}
            {(smartFilters.amenities || []).slice(0, 5).map((a) => (
              <span key={a} className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full">Amenity: {a}</span>
            ))}
          </div>
        )}

        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Date</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 text-sm"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Date</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 text-sm"
                  min={checkInDate || new Date().toISOString().split("T")[0]}
                />
                {checkInDate && checkOutDate && !isDateRangeValid() && (
                  <p className="text-red-500 text-xs mt-1">Check-out must be after check-in</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price Range: ${priceRange.min} - ${priceRange.max}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    min="0"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })}
                    placeholder="Min"
                    className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-200"
                  />
                  <input
                    type="number"
                    max="10000"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 10000 })}
                    placeholder="Max"
                    className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="luxury-villas">Villa</option>
                  <option value="mountain-cabins">Mountain Cabins</option>
                  <option value="city-apartments">City Apartment</option>
                  <option value="tropical-homes">Tropical Home</option>
                  <option value="beach-houses">Beach House</option>
                  <option value="loft">Loft</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Amenities</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {amenities.map((amenity) => (
                  <label
                    key={amenity}
                    className={`flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 transition ${
                      selectedAmenities.includes(amenity)
                        ? "border-teal-300 bg-teal-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { label: "All Types", value: "" },
            { label: "🏖️ Beach House", value: "beach-houses" },
            { label: "🏔️ Mountain Cabins", value: "mountain-cabins" },
            { label: "🏙️ City Apartment", value: "city-apartments" },
            { label: "🏰 Luxury Villa", value: "luxury-villas" },
            { label: "🌴 Tropical Home", value: "tropical-homes" },
          ].map((cat) => (
            <button
              key={cat.value}
              className={`px-4 py-1.5 rounded-full font-medium border transition text-sm ${
                filter === cat.value
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-teal-700 border-teal-200 hover:bg-teal-50"
              }`}
              onClick={() => setFilter(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="mb-4 text-gray-500 text-sm">
          {displayedFiltered.length} properties found
          {(checkInDate || checkOutDate || priceRange.min > 0 || priceRange.max < 10000 || selectedAmenities.length > 0) && (
            <span className="ml-2 text-teal-600 font-medium">(filters applied)</span>
          )}
          {smartResults && <span className="ml-2 text-teal-600 font-medium">(smart search applied)</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full bg-white border border-gray-100 rounded-2xl p-8 text-gray-500 shadow-sm">
              Loading properties...
            </div>
          ) : error ? (
            <div className="col-span-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
          ) : displayedFiltered.length === 0 ? (
            <div className="col-span-full bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
              <p className="text-gray-700 font-semibold">No properties found.</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting search or filters.</p>
            </div>
          ) : (
            displayedFiltered.map((property) => (
              <div
                key={property._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition p-3 flex flex-col"
              >
                <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3">
                  {property.images && property.images.length > 0 ? (
                    <Image src={property.images[0]} alt={property.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                  )}
                  <span className="absolute top-2 left-2 bg-white/90 text-teal-700 text-xs font-semibold px-2 py-1 rounded-full shadow">
                    {property.category?.replace(/-/g, " ")}
                  </span>
                  <button
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow hover:bg-gray-100 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(property._id);
                    }}
                    aria-label={liked.includes(property._id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart
                      className={`h-5 w-5 ${liked.includes(property._id) ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                      fill={liked.includes(property._id) ? "red" : "none"}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-500 font-bold">★ {typeof property.avgRating === "number" ? property.avgRating.toFixed(1) : "0.0"}</span>
                  <span className="text-xs text-gray-400">({property.reviewCount || 0} reviews)</span>
                </div>
                <div className="font-semibold text-base truncate">{property.title}</div>
                <div className="text-gray-500 text-sm truncate">
                  {property.city}, {property.country}
                </div>
                <div className="text-teal-600 font-bold text-lg mt-1">
                  ${property.price}
                  <span className="text-xs text-gray-500">/night</span>
                </div>
                <button
                  className="mt-3 w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-xl transition"
                  onClick={() => (window.location.href = `/guest/explore/${property._id}`)}
                >
                  Book Now
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
