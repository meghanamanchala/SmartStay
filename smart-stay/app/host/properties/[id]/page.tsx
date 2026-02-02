"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MapPin, Users, BedDouble, Wifi, Tv, Car, Snowflake, Utensils, WashingMachine } from 'lucide-react';
import HostNavbar from '@/components/navbar/HostNavbar';
import Image from 'next/image';

export default function HostPropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mainImage, setMainImage] = useState(0);
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
        <div className="max-w-6xl mx-auto mt-8">
          <button onClick={() => router.back()} className="mb-4 text-gray-500 hover:text-teal-600 flex items-center gap-1 text-sm font-medium">&larr; Back to Properties</button>
          {loading ? (
            <div className="text-gray-500">Loading property...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : !property ? (
            <div className="text-gray-500">Property not found.</div>
          ) : (
            <div className="flex flex-col md:flex-row gap-10 items-start">
              {/* Image and gallery */}
              <div className="flex-1 flex flex-col items-center">
                <div className="rounded-3xl overflow-hidden w-full max-w-2xl aspect-video bg-gray-200 mb-4">
                  {property.images && property.images.length > 0 ? (
                    <Image
                      src={property.images[mainImage]}
                      alt={property.title}
                      width={900}
                      height={500}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                  <span className="absolute top-6 left-6 bg-teal-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">Active</span>
                </div>
                <div className="flex gap-3 mt-2">
                  {property.images && property.images.length > 0 && property.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      className={`rounded-xl overflow-hidden border-2 ${mainImage === idx ? 'border-teal-500' : 'border-transparent'} focus:outline-none`}
                      onClick={() => setMainImage(idx)}
                    >
                      <Image src={img} alt={property.title} width={64} height={48} className="object-cover w-16 h-12" />
                    </button>
                  ))}
                </div>
              </div>
              {/* Property Info */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-4xl font-bold mb-2 text-gray-800 leading-tight">{property.title}</h2>
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <MapPin size={18} className="inline-block" />
                      <span>{property.city}, {property.country}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-teal-600">${property.price}</span>
                    <div className="text-xs text-gray-500">per night</div>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-6 py-3">
                    <BedDouble size={22} className="text-teal-600" />
                    <div className="font-bold text-lg text-gray-800">{property.bedrooms}</div>
                    <div className="text-xs text-gray-500">Bedrooms</div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-6 py-3">
                    <Users size={22} className="text-teal-600" />
                    <div className="font-bold text-lg text-gray-800">{property.maxGuests}</div>
                    <div className="text-xs text-gray-500">Guests</div>
                  </div>
                </div>
                <div>
                  <div className="font-semibold mb-1 text-gray-800">About this place</div>
                  <div className="text-gray-700 text-base bg-gray-100 rounded-xl p-4">{property.description}</div>
                </div>
                <div>
                  <div className="font-semibold mb-1 text-gray-800">Amenities</div>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities && property.amenities.length > 0 ? property.amenities.map((a: string, i: number) => {
                      // Map some common amenities to icons
                      let icon = null;
                      if (/wifi/i.test(a)) icon = <Wifi size={18} className="inline-block mr-1" />;
                      else if (/tv/i.test(a)) icon = <Tv size={18} className="inline-block mr-1" />;
                      else if (/parking/i.test(a)) icon = <Car size={18} className="inline-block mr-1" />;
                      else if (/air ?conditioning/i.test(a)) icon = <Snowflake size={18} className="inline-block mr-1" />;
                      else if (/kitchen/i.test(a)) icon = <Utensils size={18} className="inline-block mr-1" />;
                      else if (/washer/i.test(a)) icon = <WashingMachine size={18} className="inline-block mr-1" />;
                      return (
                        <span key={i} className="bg-teal-50 rounded-full px-4 py-1 text-teal-700 text-sm border border-teal-100 flex items-center gap-1">
                          {icon}{a}
                        </span>
                      );
                    }) : <span className="text-gray-400">No amenities listed</span>}
                  </div>
                </div>
                <button
                  className="mt-4 border border-gray-300 text-gray-700 px-5 py-2 rounded-lg font-medium hover:bg-gray-100 transition flex items-center gap-2 w-fit"
                  onClick={() => router.push(`/host/edit-property/${property._id}`)}
                >
                  Edit Property
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
