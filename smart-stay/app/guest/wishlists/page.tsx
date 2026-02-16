"use client";

import GuestNavbar from '@/components/navbar/GuestNavbar';
import { useSession } from 'next-auth/react';

import { useEffect, useState } from 'react';
import { Heart, ChevronDown } from 'lucide-react';

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

type SortOption = 'price-low' | 'price-high' | 'rating-high' | 'rating-low' | 'date-newest' | 'date-oldest';

export default function GuestWishlists() {
  const { status } = useSession();
  const [wishlists, setWishlists] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('price-low');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    async function fetchWishlists() {
      setLoading(true);
      // Get liked property IDs from localStorage for instant sync
      let likedPropertyIds: string[] = [];
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('likedProperties');
        if (local) {
          likedPropertyIds = JSON.parse(local);
        } else {
          // Fallback to backend
          const likedRes = await fetch('/api/guest/profile');
          const likedData = await likedRes.json();
          likedPropertyIds = likedData?.likedProperties || [];
        }
      }
      if (!likedPropertyIds.length) {
        setWishlists([]);
        setLoading(false);
        return;
      }
      // Fetch all properties added by hosts
      const propRes = await fetch('/api/guest/properties');
      const allProperties = await propRes.json();
      // Only show properties that are liked by the user
      const filtered = (Array.isArray(allProperties) ? allProperties : []).filter((p: Property) => likedPropertyIds.includes(p._id));
      setWishlists(filtered);
      setLoading(false);
    }
    fetchWishlists();

    const onStorage = () => fetchWishlists();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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

  function handleRemoveFromWishlist(propertyId: string): void {
    const confirmed = window.confirm('Are you sure you want to remove this property from your wishlist?');
    if (!confirmed) return;

    let likedPropertyIds: string[] = [];
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('likedProperties');
      if (local) {
        likedPropertyIds = JSON.parse(local);
      }
    }
    const updated = likedPropertyIds.filter((id) => id !== propertyId);
    localStorage.setItem('likedProperties', JSON.stringify(updated));
    setWishlists((prev) => prev.filter((p) => p._id !== propertyId));
    // Optionally, update backend
    fetch('/api/guest/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ likedProperties: updated }),
    });
  }

  const getSortedWishlists = () => {
    const sorted = [...wishlists];
    
    switch(sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating-high':
        return sorted.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
      case 'rating-low':
        return sorted.sort((a, b) => (a.avgRating || 0) - (b.avgRating || 0));
      case 'date-newest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      case 'date-oldest':
        return sorted.sort((a, b) => 
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
      default:
        return sorted;
    }
  };

  const sortOptions = [
    { label: ' Price: Low to High', value: 'price-low' as SortOption },
    { label: ' Price: High to Low', value: 'price-high' as SortOption },
    { label: ' Rating: Highest First', value: 'rating-high' as SortOption },
    { label: ' Rating: Lowest First', value: 'rating-low' as SortOption },
    { label: ' Date: Newest First', value: 'date-newest' as SortOption },
    { label: ' Date: Oldest First', value: 'date-oldest' as SortOption },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <GuestNavbar />
      <main className="flex-1 p-10 ml-64">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your Wishlists</h1>
            <p className="text-gray-500 text-base">Properties you&apos;ve saved for later</p>
          </div>
          
          {/* Sort Dropdown */}
          {!loading && wishlists.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
              >
                <span>Sort: {sortOptions.find(opt => opt.value === sortBy)?.label.split(' ').slice(1).join(' ') || 'Price: Low to High'}</span>
                <ChevronDown size={20} className={`transition ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showSortMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition first:rounded-t-lg last:rounded-b-lg ${
                        sortBy === option.value ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-gray-500 mt-10">Loading wishlists...</div>
        ) : wishlists.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No wishlisted properties yet.</p>
            <p className="text-gray-400 text-sm mt-1">Start adding properties to your wishlist!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getSortedWishlists().map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden flex flex-col h-full"
              >
                <div className="relative w-full h-48 overflow-hidden bg-gray-200">
                  <img
                    src={item.images?.[0] || '/placeholder.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition"
                  />
                  <button
                    className="absolute top-3 right-3 bg-white rounded-full p-2 shadow hover:bg-gray-100 transition"
                    aria-label="Remove from wishlist"
                    onClick={() => handleRemoveFromWishlist(item._id)}
                    title="Remove from wishlist"
                  >
                    <Heart className="h-5 w-5 fill-red-500 text-red-500" fill="red" />
                  </button>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <h2 className="text-lg font-semibold mb-1 line-clamp-2">{item.title}</h2>
                  <p className="text-gray-500 text-sm mb-3">{item.city}, {item.country}</p>
                  
                  {/* Rating */}
                  {typeof item.avgRating === 'number' && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-amber-500 font-bold">★ {item.avgRating.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({item.reviewCount || 0} reviews)</span>
                    </div>
                  )}
                  
                  {/* Price */}
                  <div className="mt-auto">
                    <span className="text-green-600 font-semibold text-lg">${item.price}</span>
                    <span className="text-gray-500 text-sm">/night</span>
                  </div>
                  
                  {/* View Details Button */}
                  <button
                    className="mt-4 w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 rounded-lg transition"
                    onClick={() => window.location.href = `/guest/explore/${item._id}`}
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
