"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Users, BedDouble, Bath, Wifi, Tv, Car, Snowflake, Utensils, WashingMachine, Waves, Lock, Flame } from 'lucide-react';
import HostNavbar from '@/components/navbar/HostNavbar';
import Image from 'next/image';

export default function HostPropertyDetail() {
  const { status } = useSession();
  const { id } = useParams();
  const propertyId = Array.isArray(id) ? id[0] : id;
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mainImage, setMainImage] = useState(0);
  const router = useRouter();
  const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('en-GB') : 'N/A');
  const getAmenityIcon = (amenity: string) => {
    const normalizedAmenity = amenity.toLowerCase().replace(/[-_]/g, ' ').trim();

    if (/wifi|internet|ethernet/.test(normalizedAmenity)) return <Wifi size={14} className="shrink-0" />;
    if (/smart\s*tv|tv|projector/.test(normalizedAmenity)) return <Tv size={14} className="shrink-0" />;
    if (/parking|garage|ev\s*charger/.test(normalizedAmenity)) return <Car size={14} className="shrink-0" />;

    if (/private\s*pool/.test(normalizedAmenity)) return <Lock size={14} className="shrink-0" />;
    if (/pool|swimming|lap\s*pool/.test(normalizedAmenity)) return <Waves size={14} className="shrink-0" />;
    if (/hot\s*tub|jacuzzi|spa/.test(normalizedAmenity)) return <Waves size={14} className="shrink-0" />;

    if (/\bac\b|air\s*conditioning|cooling|fan/.test(normalizedAmenity)) return <Snowflake size={14} className="shrink-0" />;
    if (/heating|heater|fireplace/.test(normalizedAmenity)) return <Flame size={14} className="shrink-0" />;

    if (/kitchen|bbq|grill|oven|microwave|cook/.test(normalizedAmenity)) return <Utensils size={14} className="shrink-0" />;
    if (/washer|washing|dryer|laundry|iron/.test(normalizedAmenity)) return <WashingMachine size={14} className="shrink-0" />;

    if (/security|safe|alarm|cctv|surveillance/.test(normalizedAmenity)) return <Lock size={14} className="shrink-0" />;
    if (/balcony|terrace|patio|garden|outdoor/.test(normalizedAmenity)) return <MapPin size={14} className="shrink-0" />;
    if (/pet|pets/.test(normalizedAmenity)) return <Users size={14} className="shrink-0" />;
    if (/workspace|desk|office|work\s*area/.test(normalizedAmenity)) return <BedDouble size={14} className="shrink-0" />;

    return <MapPin size={14} className="shrink-0" />;
  };

  useEffect(() => {
    if (!propertyId) return;
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/host/properties?id=${propertyId}`);
        if (!res.ok) throw new Error("Failed to fetch property");
        const data = await res.json();
        setProperty(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId]);

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

  return (
    <div className="flex min-h-screen">
      <HostNavbar />
      <main className="ml-64 flex-1 bg-gray-100/50 px-6 py-8 antialiased lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-teal-600"
            >
              <ArrowLeft size={16} />
              Back to Properties
            </button>
          </div>

          {loading ? (
            <div className="text-gray-500">Loading property...</div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-600">{error}</div>
          ) : !property ? (
            <div className="text-gray-500">Property not found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.05fr_1fr]">
              <div>
                <div className="overflow-hidden rounded-2xl bg-gray-200">
                  {property.images && property.images.length > 0 ? (
                    <Image
                      src={property.images[mainImage]}
                      alt={property.title || property.name || 'Property'}
                      width={900}
                      height={580}
                      className="h-[420px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[420px] w-full items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  {property.images && property.images.length > 0 && property.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      className={`overflow-hidden rounded-xl border-2 ${mainImage === idx ? 'border-teal-500' : 'border-transparent'} transition hover:border-teal-300`}
                      onClick={() => setMainImage(idx)}
                    >
                      <Image
                        src={img}
                        alt={property.title || 'Property image'}
                        width={74}
                        height={56}
                        className="h-14 w-[74px] object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-4xl font-semibold leading-tight tracking-tight text-gray-900">{property.title || 'Untitled property'}</h2>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <MapPin size={16} />
                      <span>{property.city || property.location || ''}{property.country ? `, ${property.country}` : ''}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-semibold leading-none tracking-tight text-teal-500">${property.price || 0}</div>
                    <div className="mt-1 text-sm text-gray-500">per night</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm leading-6 text-gray-600">
                  <div>
                    <span className="font-medium text-gray-800">Category:</span>{' '}
                    {(property.category || 'N/A').toString().replace(/-/g, ' ')}
                  </div>
                  <div className="mt-1">
                    <span className="font-medium text-gray-800">Address:</span>{' '}
                    {property.address || 'N/A'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-8 border-b border-gray-200 pb-3 text-gray-600">
                  <div className="flex items-center gap-2">
                    <BedDouble size={18} />
                    <span className="text-2xl font-semibold text-gray-900">{property.bedrooms || 0}</span>
                    <span className="text-sm">Bedrooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath size={18} />
                    <span className="text-2xl font-semibold text-gray-900">{property.bathrooms || 0}</span>
                    <span className="text-sm">Bathrooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={18} />
                    <span className="text-2xl font-semibold text-gray-900">{property.maxGuests || 0}</span>
                    <span className="text-sm">Guests</span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-3xl font-medium leading-tight tracking-tight text-gray-900">About this place</h3>
                  <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-base leading-8 text-gray-600">
                    {property.description || 'No description provided.'}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-3xl font-medium leading-tight tracking-tight text-gray-900">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities && property.amenities.length > 0 ? property.amenities.map((a: string, i: number) => {
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-sm font-medium leading-none text-teal-700"
                        >
                          {getAmenityIcon(a)}
                          {a}
                        </span>
                      );
                    }) : <span className="text-gray-400">No amenities listed</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="text-gray-400 pb-2">Property ID</div>
                    <div className="break-all text-md font-medium leading-tight text-gray-800">{property._id}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="text-gray-400 pb-2">Created</div>
                    <div className="text-md font-medium leading-tight tracking-tight text-gray-800">{formatDate(property.createdAt)}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="text-gray-400 pb-2">Updated</div>
                    <div className="text-md font-medium leading-tight tracking-tight text-gray-800">{formatDate(property.updatedAt)}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="text-gray-400 pb-2">Images</div>
                    <div className="text-md font-medium leading-tight tracking-tight text-gray-800">{Array.isArray(property.images) ? property.images.length : 0}</div>
                  </div>
                </div>

                <button
                  className="mt-1 w-fit rounded-xl border border-gray-300 px-7 py-3 font-medium text-gray-700 transition hover:bg-gray-100"
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
