"use client";

import GuestNavbar from '@/components/navbar/GuestNavbar';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Users, BedDouble, Bath } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function GuestPropertyDetails() {
  const { status } = useSession();
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveError, setReserveError] = useState('');
  const [reserveSuccess, setReserveSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ checkIn?: string; checkOut?: string; guests?: string }>({});
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  const cleaningFee = 75;
  const serviceFee = 50;
  const today = new Date().toISOString().split('T')[0];

  const calcNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const nights = calcNights();
  const subtotal = property ? property.price * nights : 0;
  const total = subtotal + (nights > 0 ? cleaningFee + serviceFee : 0);

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

  useEffect(() => {
    let isActive = true;

    const checkAvailability = async () => {
      if (!property || !checkIn || !checkOut || nights <= 0) {
        setAvailabilityStatus('idle');
        setAvailabilityMessage('');
        return;
      }

      setAvailabilityStatus('checking');
      setAvailabilityMessage('');

      try {
        const availabilityRes = await fetch('/api/guest/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: property._id,
            checkIn,
            checkOut,
          }),
        });

        if (!availabilityRes.ok) {
          const data = await availabilityRes.json();
          if (!isActive) return;
          setAvailabilityStatus('unavailable');
          setAvailabilityMessage(data?.error || 'Failed to check availability');
          return;
        }

        const availabilityData = await availabilityRes.json();
        if (!isActive) return;
        if (availabilityData?.available) {
          setAvailabilityStatus('available');
          setAvailabilityMessage('Dates are available.');
        } else {
          setAvailabilityStatus('unavailable');
          setAvailabilityMessage(availabilityData?.reason || 'Selected dates are not available');
        }
      } catch (err: any) {
        if (!isActive) return;
        setAvailabilityStatus('unavailable');
        setAvailabilityMessage(err.message || 'Failed to check availability');
      }
    };

    const timer = setTimeout(checkAvailability, 300);
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [property, checkIn, checkOut, nights]);

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
  if (!id) return <div className="flex min-h-screen"><GuestNavbar /><main className="flex-1 p-8 bg-gray-50 ml-64 flex items-center justify-center text-gray-500">No property selected.</main></div>;

  const validateForm = () => {
    const nextErrors: { checkIn?: string; checkOut?: string; guests?: string } = {};

    if (!checkIn) nextErrors.checkIn = 'Select a check-in date.';
    if (!checkOut) nextErrors.checkOut = 'Select a check-out date.';
    if (checkIn && checkOut && nights <= 0) {
      nextErrors.checkOut = 'Check-out must be after check-in.';
    }
    if (!property || guests < 1 || guests > property.maxGuests) {
      nextErrors.guests = property ? `Guests must be between 1 and ${property.maxGuests}.` : 'Select guests.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleReserve = async () => {
    if (!property) return;
    setReserveError('');
    setReserveSuccess(false);

    if (!validateForm()) return;

    try {
      setReserveLoading(true);
      const availabilityRes = await fetch('/api/guest/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property._id,
          checkIn,
          checkOut,
        }),
      });

      if (!availabilityRes.ok) {
        const data = await availabilityRes.json();
        throw new Error(data?.error || 'Failed to check availability');
      }

      const availabilityData = await availabilityRes.json();
      if (!availabilityData?.available) {
        setReserveError(availabilityData?.reason || 'Selected dates are not available');
        setAvailabilityStatus('unavailable');
        setAvailabilityMessage(availabilityData?.reason || 'Selected dates are not available');
        return;
      }

      const res = await fetch('/api/guest/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property._id,
          checkIn,
          checkOut,
          guests,
          pricePerNight: property.price,
          cleaningFee,
          serviceFee,
          totalPrice: total,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to reserve');
      }

      setReserveSuccess(true);
      setTimeout(() => {
        router.push('/guest/bookings');
      }, 1500);
    } catch (err: any) {
      setReserveError(err.message || 'Failed to reserve');
    } finally {
      setReserveLoading(false);
    }
  };

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
              <button onClick={() => router.back()} className="text-teal-600 text-sm mb-2 no-underline hover:no-underline hover:cursor-pointer">&lt; Back to explore</button>
              <h1 className="text-3xl font-bold mb-1">{property.title}</h1>
              <div className="flex items-center gap-2 text-amber-500 font-semibold text-base mb-1">
                ★ {typeof property.avgRating === "number" ? property.avgRating.toFixed(1) : "0.0"} <span className="text-gray-400">({property.reviewCount || 0} reviews)</span>
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
                      <input
                        type="date"
                        min={today}
                        value={checkIn}
                        onChange={(e) => {
                          setCheckIn(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, checkIn: undefined }));
                          setAvailabilityStatus('idle');
                          setAvailabilityMessage('');
                          if (checkOut && e.target.value >= checkOut) {
                            setCheckOut('');
                          }
                        }}
                        className="w-1/2 border rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type="date"
                        min={checkIn || today}
                        value={checkOut}
                        onChange={(e) => {
                          setCheckOut(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, checkOut: undefined }));
                          setAvailabilityStatus('idle');
                          setAvailabilityMessage('');
                        }}
                        className="w-1/2 border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    {fieldErrors.checkIn ? (
                      <div className="text-xs text-red-500 mb-1">{fieldErrors.checkIn}</div>
                    ) : null}
                    {fieldErrors.checkOut ? (
                      <div className="text-xs text-red-500 mb-2">{fieldErrors.checkOut}</div>
                    ) : null}
                    {availabilityStatus === 'checking' ? (
                      <div className="text-xs text-gray-500 mb-2">Checking availability...</div>
                    ) : null}
                    {availabilityStatus === 'available' ? (
                      <div className="text-xs text-green-600 mb-2">{availabilityMessage}</div>
                    ) : null}
                    {availabilityStatus === 'unavailable' ? (
                      <div className="text-xs text-red-500 mb-2">{availabilityMessage}</div>
                    ) : null}
                    <select
                      className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                      value={guests}
                      onChange={(e) => {
                        setGuests(Number(e.target.value));
                        setFieldErrors((prev) => ({ ...prev, guests: undefined }));
                      }}
                    >
                      {[...Array(Number(property.maxGuests) || 1)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1} guest{i + 1 > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                    {fieldErrors.guests ? (
                      <div className="text-xs text-red-500 mb-2">{fieldErrors.guests}</div>
                    ) : null}
                    <button
                      type="button"
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60 hover:cursor-pointer"
                      onClick={handleReserve}
                      disabled={reserveLoading || nights === 0 || availabilityStatus === 'checking' || availabilityStatus === 'unavailable'}
                    >
                      {reserveLoading ? 'Reserving...' : 'Reserve'}
                    </button>
                  </form>
                  {reserveSuccess ? (
                    <div className="text-sm text-green-600 mb-2">Reservation confirmed! Redirecting…</div>
                  ) : null}
                  {reserveError ? (
                    <div className="text-sm text-red-500 mb-2">{reserveError}</div>
                  ) : null}
                  <div className="text-sm text-gray-500 mb-2">You won’t be charged yet</div>
                  <div className="border-t pt-2 text-sm text-gray-700">
                    <div className="flex justify-between mb-1"><span>${property.price} x {nights} night{nights === 1 ? '' : 's'}</span><span>${subtotal}</span></div>
                    <div className="flex justify-between mb-1"><span>Cleaning fee</span><span>$75</span></div>
                    <div className="flex justify-between mb-1"><span>Service fee</span><span>$50</span></div>
                    <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>${total}</span></div>
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
