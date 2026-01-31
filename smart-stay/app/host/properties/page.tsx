"use client";

import HostNavbar from '@/components/navbar/HostNavbar';
import Image from 'next/image';

import { useEffect, useState } from 'react';

export default function HostProperties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="flex min-h-screen">
      <HostNavbar />
      <main className="flex-1 p-8 bg-gray-50 ml-64">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">My Properties</h1>
            <p className="text-gray-500 text-sm">Manage your property listings</p>
          </div>
          <a href="/host/add-property" className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-2 rounded-lg shadow flex items-center gap-2">
            + Add Property
          </a>
        </div>
        <div className="space-y-6 mt-4">
          {loading ? (
            <div className="text-gray-500">Loading properties...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : properties.length === 0 ? (
            <div className="text-gray-500">No properties found.</div>
          ) : (
            properties.map((property) => (
              <div key={property._id} className="bg-white rounded-xl shadow p-6 flex gap-6 items-center">
                <div className="relative w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
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
                  <span className="absolute top-2 left-2 bg-teal-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Active</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{property.title}</h2>
                      <p className="text-gray-500 text-sm">{property.city}, {property.country}</p>
                    </div>
                    {/* You can add rating/reviews here if you store them */}
                  </div>
                  <div className="flex gap-6 mt-4">
                    <div className="bg-gray-50 rounded-lg px-4 py-2 text-center">
                      <div className="text-teal-500 font-bold text-lg">${property.price}</div>
                      <div className="text-xs text-gray-500">per night</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-4 py-2 text-center">
                      <div className="font-bold text-lg">{property.bedrooms}</div>
                      <div className="text-xs text-gray-500">bedrooms</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-4 py-2 text-center">
                      <div className="font-bold text-lg">{property.maxGuests}</div>
                      <div className="text-xs text-gray-500">guests</div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg font-medium hover:bg-gray-100">View</button>
                    <button className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg font-medium hover:bg-gray-100">Edit</button>
                    <button className="border border-red-200 text-red-500 px-4 py-1.5 rounded-lg font-medium hover:bg-red-50">Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
