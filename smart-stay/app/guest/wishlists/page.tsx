"use client";

import GuestNavbar from '@/components/navbar/GuestNavbar';
import { useSession } from 'next-auth/react';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Trash2 } from 'lucide-react';

interface Property {
  _id: string;
  title: string;
  city: string;
  country: string;
  price: number;
  images: string[];
  host: string;
}

export default function GuestWishlists() {
  const { status } = useSession();
  const [wishlists, setWishlists] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <GuestNavbar />
      <main className="flex-1 p-10 ml-64">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">Your Wishlists</h1>
            <p className="text-gray-500 text-base">Properties you&apos;ve saved for later</p>
          </div>
        </div>
        {loading ? (
          <div className="text-gray-500 mt-10">Loading...</div>
        ) : wishlists.length === 0 ? (
          <div className="text-gray-500 mt-10">No wishlisted properties yet.</div>
        ) : (
          <div className="flex gap-6 mt-6 flex-wrap">
            {wishlists.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl shadow p-4 w-80 flex-shrink-0 relative flex flex-col"
              >
                <img
                  src={item.images?.[0] || '/placeholder.jpg'}
                  alt={item.title}
                  className="rounded-xl w-full h-44 object-cover mb-4"
                />
                <button
                  className="absolute top-4 right-4 bg-white rounded-full p-1 shadow hover:bg-gray-100 transition"
                  aria-label="Remove from wishlist"
                  onClick={() => handleRemoveFromWishlist(item._id)}
                >
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" fill="red" />
                </button>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-1">{item.title}</h2>
                  <p className="text-gray-500 text-sm mb-2">{item.city}, {item.country}</p>
                  <span className="text-green-500 font-semibold text-base">${item.price}/night</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
