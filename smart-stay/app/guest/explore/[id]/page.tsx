"use client";

import GuestNavbar from '@/components/navbar/GuestNavbar';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Users, BedDouble, Bath } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function PropertyDetail() {
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
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  useEffect(() => {
    if (!id) return;
    const fetchProperty = async () => {
      try {
        const res = await fetch('/api/guest/properties');
        if (!res.ok) throw new Error('Failed to fetch property');
        const data = await res.json();
        const found = data.find((p: any) => p._id === id);
        setProperty(found);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  if (!id) return <div className="flex min-h-screen"><GuestNavbar /><main className="flex-1 p-8 bg-gray-50 ml-64 flex items-center justify-center text-gray-500">No property selected.</main></div>;

  return (
    <div className="flex min-h-screen">
      <GuestNavbar />
      <main className="flex-1 bg-gray-50 ml-64">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">{error}</div>
        ) : !property ? (
          <div className="flex items-center justify-center h-full text-gray-500">Property not found.</div>
        ) : (
          <div className="max-w-6xl mx-auto py-5">
            <div className="mb-6">
              <button onClick={() => router.back()} className="text-teal-600 hover:underline text-sm mb-2">&lt; Back to explore</button>
              <h1 className="text-3xl font-bold mb-1">{property.title}</h1>
              <div className="flex items-center gap-2 text-amber-500 font-semibold text-base mb-1">
                ★ 4.9 <span className="text-gray-400 font-normal">(342 reviews)</span>
                <span className="text-gray-500 ml-2">• {property.city}, {property.country}</span>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden w-full h-80 relative mb-8">
              {property.images && property.images.length > 0 ? (
                <Image src={property.images[0]} alt={property.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
              )}
            </div>
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <div className="mb-4 text-lg font-semibold">
                  Villa hosted by {property.hostDetails?.name || 'Unknown Host'}
                </div>
                <div className="flex gap-6 text-gray-600 mb-4">
                  <span className="flex items-center gap-1"><Users size={18} className="inline-block" /> {property.maxGuests} guests</span>
                  <span className="flex items-center gap-1"><BedDouble size={18} className="inline-block" /> {property.bedrooms} bedrooms</span>
                  <span className="flex items-center gap-1"><Bath size={18} className="inline-block" /> {property.bathrooms} baths</span>
                </div>
                <div className="flex gap-4 mb-6">
                  <div className="bg-teal-50 rounded-lg px-6 py-4 text-center">
                    <div className="text-2xl font-bold text-teal-600">4.5</div>
                    <div className="text-xs text-gray-500">Safety Score</div>
                  </div>
                  <div className="bg-teal-50 rounded-lg px-6 py-4 text-center">
                    <div className="text-2xl font-bold text-teal-600">4.9</div>
                    <div className="text-xs text-gray-500">Eco Score</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="font-semibold mb-1">About this place</div>
                  <div className="text-gray-700">{property.description}</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Amenities</div>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities && property.amenities.length > 0 ? property.amenities.map((a: string, i: number) => (
                      <span key={i} className="bg-gray-100 rounded-full px-4 py-1 text-gray-700 text-sm">{a}</span>
                    )) : <span className="text-gray-400">No amenities listed</span>}
                  </div>
                </div>
              </div>
              <div className="w-full max-w-xs mx-auto lg:mx-0">
                <div className="bg-white rounded-2xl shadow p-6 sticky top-8">
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-bold text-teal-600">${property.price}</span>
                    <span className="text-gray-500">/night</span>
                  </div>
                  <form className="mb-4">
                    <div className="flex gap-2 mb-2">
                      <input type="text" placeholder="Check-in" className="w-1/2 border rounded-lg px-3 py-2 text-sm" />
                      <input type="text" placeholder="Check-out" className="w-1/2 border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm mb-2">
                      <option>1 guest</option>
                      {[...Array(property.maxGuests - 1)].map((_, i) => (
                        <option key={i + 2}>{i + 2} guests</option>
                      ))}
                    </select>
                    <button type="button" className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 rounded-lg transition">Reserve</button>
                  </form>
                  <div className="text-sm text-gray-500 mb-2">You won’t be charged yet</div>
                  <div className="border-t pt-2 text-sm text-gray-700">
                    <div className="flex justify-between mb-1"><span>${property.price} x 5 nights</span><span>${property.price * 5}</span></div>
                    <div className="flex justify-between mb-1"><span>Cleaning fee</span><span>$75</span></div>
                    <div className="flex justify-between mb-1"><span>Service fee</span><span>$50</span></div>
                    <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>${property.price * 5 + 75 + 50}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
