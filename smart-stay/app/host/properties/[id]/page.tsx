"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import HostNavbar from '@/components/navbar/HostNavbar';
import Image from 'next/image';

export default function HostPropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/host/properties`);
        if (!res.ok) throw new Error("Failed to fetch property");
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

  return (
    <div className="flex min-h-screen">
      <HostNavbar />
      <main className="flex-1 p-8 bg-gray-50 ml-64">
        <div className="max-w-3xl mx-auto mt-8">
          {loading ? (
            <div className="text-gray-500">Loading property...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : !property ? (
            <div className="text-gray-500">Property not found.</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-0 overflow-hidden flex flex-col md:flex-row">
              <div className="relative w-full md:w-96 h-64 md:h-auto flex-shrink-0">
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
                <span className="absolute top-3 left-3 bg-teal-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">Active</span>
              </div>
              <div className="flex-1 p-8 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b pb-4 mb-2">
                  <div>
                    <h2 className="text-3xl font-bold mb-1 text-gray-800">{property.title}</h2>
                    <p className="text-gray-500 text-base mb-2">{property.city}, {property.country}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-teal-600">${property.price}</span>
                    <div className="text-xs text-gray-500">per night</div>
                  </div>
                </div>
                <div className="flex gap-6 mb-2">
                  <div className="bg-gray-50 rounded-lg px-6 py-3 text-center flex-1">
                    <div className="font-bold text-lg text-gray-800">{property.bedrooms}</div>
                    <div className="text-xs text-gray-500">Bedrooms</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-6 py-3 text-center flex-1">
                    <div className="font-bold text-lg text-gray-800">{property.maxGuests}</div>
                    <div className="text-xs text-gray-500">Guests</div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="font-semibold mb-1 text-gray-800">About this place</div>
                  <div className="text-gray-700 text-base bg-gray-100 rounded p-3">{property.description}</div>
                </div>
                <div>
                  <div className="font-semibold mb-1 text-gray-800">Amenities</div>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities && property.amenities.length > 0 ? property.amenities.map((a: string, i: number) => (
                      <span key={i} className="bg-teal-50 rounded-full px-4 py-1 text-teal-700 text-sm border border-teal-100">{a}</span>
                    )) : <span className="text-gray-400">No amenities listed</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
