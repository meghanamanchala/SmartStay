
"use client";
import { useSession } from 'next-auth/react';

import GuestNavbar from '@/components/navbar/GuestNavbar';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Heart, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function GuestExplore() {
  const { status } = useSession();
  const searchParams = useSearchParams();

  // All hooks must be called unconditionally before any early returns
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [liked, setLiked] = useState<string[]>([]);
  
  // Advanced filters
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const amenities = [
    'WiFi',
    'Pool',
    'Kitchen',
    'Parking',
    'AC',
    'Heating',
    'Washer',
    'Dryer',
    'TV',
    'Gym',
  ];

  useEffect(() => {
    const querySearch = searchParams.get('search') || '';
    setSearch(querySearch);
  }, [searchParams]);

  useEffect(() => {
    const local = typeof window !== 'undefined' ? localStorage.getItem('likedProperties') : null;
    if (local) {
      setLiked(JSON.parse(local));
    } else {
      async function fetchLiked() {
        const res = await fetch('/api/guest/profile');
        if (res.ok) {
          const data = await res.json();
          setLiked(data?.likedProperties || []);
          localStorage.setItem('likedProperties', JSON.stringify(data?.likedProperties || []));
        }
      }
      fetchLiked();
    }
  }, []);


  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch('/api/guest/properties');
        if (!res.ok) throw new Error('Failed to fetch properties');
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


  const toggleWishlist = async (propertyId: string) => {
    let updated: string[];
    if (liked.includes(propertyId)) {
      updated = liked.filter((id) => id !== propertyId);
    } else {
      updated = [...liked, propertyId];
    }
    setLiked(updated);
    localStorage.setItem('likedProperties', JSON.stringify(updated));
    await fetch('/api/guest/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ likedProperties: updated }),
    });
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const isDateRangeValid = () => {
    if (!checkInDate || !checkOutDate) return true;
    return new Date(checkInDate) < new Date(checkOutDate);
  };

  const filtered = properties.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase()) ||
      p.country?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter ? p.category === filter : true;
    
    const matchesPrice = p.price >= priceRange.min && p.price <= priceRange.max;
    
    const matchesAmenities = selectedAmenities.length === 0 || 
      selectedAmenities.every(amenity => 
        p.amenities?.some((a: string) => a.toLowerCase().includes(amenity.toLowerCase()))
      );
    
    return matchesSearch && matchesFilter && matchesPrice && matchesAmenities;
  });

  return (
    <div className="flex min-h-screen">
      <GuestNavbar />
      <main className="flex-1 p-8 bg-gray-50 ml-64">
        <h1 className="text-2xl font-bold mb-6">Explore Properties</h1>
        
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by location or property name..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-teal-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span>Filters</span>
            <ChevronDown size={20} className={`transition ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Date</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-teal-500 text-sm"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Date</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-teal-500 text-sm"
                  min={checkInDate || new Date().toISOString().split('T')[0]}
                />
                {checkInDate && checkOutDate && !isDateRangeValid() && (
                  <p className="text-red-500 text-xs mt-1">Check-out must be after check-in</p>
                )}
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price Range: ${priceRange.min} - ${priceRange.max}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    min="0"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({...priceRange, min: parseInt(e.target.value) || 0})}
                    placeholder="Min"
                    className="w-1/2 border rounded px-2 py-1 text-xs focus:outline-teal-500"
                  />
                  <input
                    type="number"
                    max="10000"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({...priceRange, max: parseInt(e.target.value) || 10000})}
                    placeholder="Max"
                    className="w-1/2 border rounded px-2 py-1 text-xs focus:outline-teal-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-teal-500 text-sm"
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

            {/* Amenities Filter */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Amenities</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {amenities.map((amenity) => (
                  <label key={amenity} className="flex items-center gap-2 cursor-pointer">
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

            {/* Clear Filters Button */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setCheckInDate('');
                  setCheckOutDate('');
                  setPriceRange({ min: 0, max: 10000 });
                  setSelectedAmenities([]);
                  setFilter('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Category Quick Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { label: 'All Types', value: '' },
            { label: '🏖️ Beach House', value: 'beach-houses' },
            { label: '🏔️ Mountain Cabins', value: 'mountain-cabins' },
            { label: '🏙️ City Apartment', value: 'city-apartments' },
            { label: '🏰 Luxury Villa', value: 'luxury-villas' },
            { label: '🌴 Tropical Home', value: 'tropical-homes' },
          ].map((cat) => (
            <button
              key={cat.value}
              className={`px-4 py-1.5 rounded-full font-medium border transition text-sm ${filter === cat.value ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50'}`}
              onClick={() => setFilter(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="mb-4 text-gray-500 text-sm">
          {filtered.length} properties found
          {(checkInDate || checkOutDate || priceRange.min > 0 || priceRange.max < 10000 || selectedAmenities.length > 0) && (
            <span className="ml-2 text-teal-600 font-medium">(filters applied)</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {loading ? (
            <div className="col-span-full text-gray-500">Loading properties...</div>
          ) : error ? (
            <div className="col-span-full text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-gray-500">No properties found.</div>
          ) : (
            filtered.map((property) => (
              <div key={property._id} className="bg-white rounded-2xl shadow hover:shadow-lg transition p-3 flex flex-col items-center">
                <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3">
                  {property.images && property.images.length > 0 ? (
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                  )}
                  <span className="absolute top-2 left-2 bg-white/80 text-teal-600 text-xs font-semibold px-2 py-1 rounded-full shadow">{property.category?.replace(/-/g, ' ')}</span>
                  <button
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100 transition"
                    onClick={e => { e.stopPropagation(); toggleWishlist(property._id); }}
                    aria-label={liked.includes(property._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart className={`h-6 w-6 ${liked.includes(property._id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} fill={liked.includes(property._id) ? 'red' : 'none'} />
                  </button>
                </div>
                <div className="w-full flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-500 font-bold">★ {typeof property.avgRating === 'number' ? property.avgRating.toFixed(1) : '0.0'}</span>
                    <span className="text-xs text-gray-400">({property.reviewCount || 0} reviews)</span>
                  </div>
                  <div className="font-semibold text-base truncate w-full">{property.title}</div>
                  <div className="text-gray-500 text-sm truncate w-full">{property.city}, {property.country}</div>
                  <div className="text-teal-500 font-bold text-lg mt-1">${property.price}<span className="text-xs text-gray-500">/night</span></div>
                  <button
                    className="mt-3 w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 rounded-lg transition"
                    onClick={() => window.location.href = `/guest/explore/${property._id}`}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
