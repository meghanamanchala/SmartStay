"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from "react";
import HostNavbar from '@/components/navbar/HostNavbar';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';


export default function EditHostProperty() {
  // Move all hooks to the top
  const { status } = useSession();
  const { id } = useParams();
  const propertyId = Array.isArray(id) ? id[0] : id;
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({});
  const [amenityInput, setAmenityInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [popup, setPopup] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "success" | "error";
  }>({
    open: false,
    title: "",
    message: "",
    variant: "success",
  });
  const router = useRouter();
  const [mainImage, setMainImage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputClass = "mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100";
  const labelClass = "text-sm font-medium text-gray-700";

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setForm((prev: any) => ({
          ...prev,
          images: prev.images ? [ev.target?.result as string, ...prev.images] : [ev.target?.result as string],
        }));
        setProperty((prev: any) => ({
          ...prev,
          images: prev.images ? [ev.target?.result as string, ...prev.images] : [ev.target?.result as string],
        }));
        setMainImage(0);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!propertyId) return;
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/host/properties?id=${propertyId}`);
        if (!res.ok) throw new Error("Failed to fetch property");
        const found = await res.json();
        setProperty(found);
        setForm({
          ...found,
          amenities: Array.isArray(found?.amenities) ? found.amenities : [],
          images: Array.isArray(found?.images) ? found.images : [],
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId]);

  useEffect(() => {
    if (!popup.open) return;

    const timer = setTimeout(() => {
      setPopup((prev) => ({ ...prev, open: false }));
    }, 3000);

    return () => clearTimeout(timer);
  }, [popup.open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = new Set(["price", "bedrooms", "bathrooms", "maxGuests"]);

    if (numericFields.has(name)) {
      setForm({ ...form, [name]: value === "" ? "" : Number(value) });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleAmenityAdd = () => {
    const parts = amenityInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    setForm((prev: any) => {
      const existing = Array.isArray(prev.amenities) ? prev.amenities : [];
      const existingSet = new Set(existing.map((a: string) => a.toLowerCase()));
      const next = parts.filter((item) => !existingSet.has(item.toLowerCase()));
      return { ...prev, amenities: [...existing, ...next] };
    });

    setAmenityInput("");
  };

  const handleAmenityRemove = (amenity: string) => {
    setForm((prev: any) => ({
      ...prev,
      amenities: (Array.isArray(prev.amenities) ? prev.amenities : []).filter((a: string) => a !== amenity),
    }));
  };

  const handleSubmit = async (e: any) => {
  e.preventDefault();
  try {
    const payload = {
      ...form,
      price: Number(form.price),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      maxGuests: Number(form.maxGuests),
      amenities: Array.isArray(form.amenities) ? form.amenities : [],
      images: Array.isArray(form.images) ? form.images : [],
    };

    const res = await fetch(`/api/host/properties?id=${propertyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update property');
    }

    setPopup({
      open: true,
      title: 'Saved',
      message: 'Property updated successfully.',
      variant: 'success',
    });
    setTimeout(() => {
      router.push('/host/properties');
    }, 1200);
  } catch (err: any) {
    setPopup({
      open: true,
      title: 'Update failed',
      message: err.message || 'Something went wrong',
      variant: 'error',
    });
  }
};

  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!propertyId) {
      setPopup({
        open: true,
        title: 'Delete failed',
        message: 'Invalid property id',
        variant: 'error',
      });
      return;
    }

    try {
      setShowDeleteConfirm(false);
      setDeleting(true);
      const res = await fetch(`/api/host/properties?id=${propertyId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete property');
      }

      setPopup({
        open: true,
        title: 'Deleted',
        message: 'Property deleted successfully.',
        variant: 'success',
      });
      setTimeout(() => {
        router.push('/host/properties');
      }, 1000);
    } catch (err: any) {
      setPopup({
        open: true,
        title: 'Delete failed',
        message: err.message || 'Something went wrong',
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };


  // Conditional rendering inside return
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
              {/* Image Gallery */}
              <div>
                <div className="overflow-hidden rounded-2xl bg-gray-200">
                  {form.images && form.images.length > 0 ? (
                    <Image
                      src={form.images[mainImage]}
                      alt={form.title}
                      width={900}
                      height={580}
                      className="h-[420px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[420px] w-full items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  {form.images && form.images.length > 0 && form.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative group">
                      <button
                        type="button"
                        className={`overflow-hidden rounded-xl border-2 ${mainImage === idx ? 'border-teal-500' : 'border-transparent'} transition hover:border-teal-300 focus:outline-none`}
                        onClick={() => setMainImage(idx)}
                      >
                        <Image src={img} alt={form.title} width={74} height={56} className="h-14 w-[74px] object-cover" />
                      </button>
                      <button
                        type="button"
                        className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 shadow transition hover:bg-red-500 hover:text-white"
                        title="Remove image"
                        onClick={() => {
                          setForm((prev: any) => ({
                            ...prev,
                            images: prev.images.filter((_: string, i: number) => i !== idx),
                          }));
                          setProperty((prev: any) => ({
                            ...prev,
                            images: prev.images.filter((_: string, i: number) => i !== idx),
                          }));
                          if (mainImage === idx) setMainImage(0);
                          else if (mainImage > idx) setMainImage(mainImage - 1);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="flex h-14 w-[74px] items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white text-2xl text-gray-400 transition hover:border-teal-400 hover:text-teal-500"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    +
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
              {/* Form */}
              <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 flex flex-col gap-6">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Edit Property</h2>
                  <p className="mt-1 text-sm text-gray-500">Update your listing details, amenities, and images.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={labelClass}>Title
                    <input name="title" value={form.title || ''} onChange={handleChange} className={inputClass} />
                  </label>
                  <label className={labelClass}>Category
                    <select name="category" value={form.category || ''} onChange={handleChange} className={inputClass}>
                      <option value="">Select category</option>
                      <option value="luxury-villas">Luxury Villas</option>
                      <option value="mountain-cabins">Mountain Cabins</option>
                      <option value="tropical-homes">Tropical Homes</option>
                      <option value="city-apartments">City Apartments</option>
                      <option value="beach-houses">Beach Houses</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label className={`${labelClass} col-span-2`}>Address
                    <input name="address" value={form.address || ''} onChange={handleChange} className={inputClass} />
                  </label>
                  <div className="flex gap-4">
                    <label className={`${labelClass} flex-1`}>City
                      <input name="city" value={form.city || ''} onChange={handleChange} className={inputClass} />
                    </label>
                    <label className={`${labelClass} flex-1`}>Country
                      <input name="country" value={form.country || ''} onChange={handleChange} className={inputClass} />
                    </label>
                  </div>
                  <label className={`${labelClass} col-span-2`}>Price per night ($)
                    <input name="price" type="number" value={form.price || ''} onChange={handleChange} className={inputClass} />
                  </label>
                  <div className="flex gap-4">
                    <label className={`${labelClass} flex-1`}>Bedrooms
                      <input name="bedrooms" type="number" value={form.bedrooms || ''} onChange={handleChange} className={inputClass} />
                    </label>
                    <label className={`${labelClass} flex-1`}>Bathrooms
                      <input name="bathrooms" type="number" value={form.bathrooms || ''} onChange={handleChange} className={inputClass} />
                    </label>
                    <label className={`${labelClass} flex-1`}>Max Guests
                      <input name="maxGuests" type="number" value={form.maxGuests || ''} onChange={handleChange} className={inputClass} />
                    </label>
                  </div>
                  <label className={`${labelClass} col-span-2`}>Description
                    <textarea name="description" value={form.description || ''} onChange={handleChange} className={`${inputClass} min-h-[100px]`} />
                  </label>
                  <div className={`${labelClass} col-span-2`}>
                    Amenities
                    <div className="flex gap-2 mt-1">
                      <input
                        value={amenityInput}
                        onChange={(e) => setAmenityInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAmenityAdd();
                          }
                        }}
                        className={inputClass}
                        placeholder="Add amenity (comma separated)"
                      />
                      <button
                        type="button"
                        onClick={handleAmenityAdd}
                        className="rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(Array.isArray(form.amenities) ? form.amenities : []).length === 0 ? (
                        <span className="text-sm text-gray-400">No amenities added</span>
                      ) : (
                        (Array.isArray(form.amenities) ? form.amenities : []).map((amenity: string, index: number) => (
                          <span
                            key={`${amenity}-${index}`}
                            className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-sm text-teal-700"
                          >
                            {amenity}
                            <button
                              type="button"
                              onClick={() => handleAmenityRemove(amenity)}
                              className="h-5 w-5 rounded-full border border-teal-200 bg-white text-xs leading-none text-teal-700 transition hover:border-red-500 hover:bg-red-500 hover:text-white"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <button type="submit" className="flex-1 rounded-xl bg-teal-500 px-5 py-3 text-base font-semibold text-white transition hover:bg-teal-600">Save Changes</button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 rounded-xl bg-red-100 px-5 py-3 text-base font-semibold text-red-600 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">Delete property?</h3>
            <p className="mt-2 text-sm text-gray-600">This action cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {popup.open ? (
        <div className="fixed right-6 top-6 z-50 w-full max-w-sm">
          <div
            className={`rounded-xl border p-4 shadow-xl ${
              popup.variant === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold">{popup.title}</div>
                <div className="mt-1 text-sm">{popup.message}</div>
              </div>
              <button
                type="button"
                onClick={() => setPopup((prev) => ({ ...prev, open: false }))}
                className="rounded-md px-2 py-1 text-sm font-semibold hover:bg-white/70 transition"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
