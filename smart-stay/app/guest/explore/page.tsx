
"use client";
import { useSession } from 'next-auth/react';

import GuestNavbar from '@/components/navbar/GuestNavbar';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

export default function GuestExplore() {
  const { status } = useSession();
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
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [liked, setLiked] = useState<string[]>([]);
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
  const toggleWishlist = async (propertyId: string) => {
    let updated: string[];
    if (liked.includes(propertyId)) {
      updated = liked.filter((id) => id !== propertyId);
    } else {
      // Add to wishlist
      updated = [...liked, propertyId];
    }
    setLiked(updated);
    // Sync to localStorage for instant update in Wishlists page
    localStorage.setItem('likedProperties', JSON.stringify(updated));
    // Optionally, update backend
    await fetch('/api/guest/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ likedProperties: updated }),
    });
  };

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch('/api/host/properties');
        if (!res.ok) throw new Error('Failed to fetch properties');
        const data = await res.json();
        setProperties(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const filtered = properties.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase()) ||
      p.country?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter ? p.category === filter : true;
    return matchesSearch && matchesFilter;
  });

  const categories = [
    { label: 'All Types', value: '' },
    { label: 'Villa', value: 'luxury-villas' },
    { label: 'Cabin', value: 'mountain-cabins' },
    { label: 'Loft', value: 'loft' },
    { label: 'Apartment', value: 'city-apartments' },
    { label: 'Tropical Home', value: 'tropical-homes' },
    { label: 'Beach House', value: 'beach-houses' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <div className="flex min-h-screen">
      <GuestNavbar />
      <main className="flex-1 p-8 bg-gray-50 ml-64">
        <h1 className="text-2xl font-bold mb-2">Explore Properties</h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by location or property name..."
            className="w-full md:w-1/2 border rounded-lg px-4 py-2 focus:outline-teal-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            {categories.map((cat) => (
              <button
                key={cat.value}
                className={`px-4 py-1.5 rounded-full font-medium border transition ${filter === cat.value ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50'}`}
                onClick={() => setFilter(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4 text-gray-500 text-sm">{filtered.length} properties found</div>
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
                    <span className="text-amber-500 font-bold">★ 4.9</span>
                    <span className="text-xs text-gray-400">(342 reviews)</span>
                  </div>
                  <div className="font-semibold text-base truncate w-full">{property.title}</div>
                  <div className="text-gray-500 text-sm truncate w-full">{property.city}, {property.country}</div>
                  <div className="text-teal-500 font-bold text-lg mt-1">${property.price}<span className="text-xs text-gray-500 font-normal">/night</span></div>
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
