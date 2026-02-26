"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from "react";
import HostNavbar from '@/components/navbar/HostNavbar';
import Image from 'next/image';


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
      <main className="flex-1 p-8 bg-gray-50 ml-64">
        <div className="max-w-6xl mx-auto mt-8">
          {loading ? (
            <div className="text-gray-500">Loading property...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : !property ? (
            <div className="text-gray-500">Property not found.</div>
          ) : (
            <div className="flex flex-col md:flex-row gap-10 items-start">
              {/* Image Gallery */}
              <div className="flex-1 flex flex-col items-center">
                <div className="rounded-2xl overflow-hidden w-full max-w-lg aspect-video bg-gray-200 mb-4">
                  {form.images && form.images.length > 0 ? (
                    <Image
                      src={form.images[mainImage]}
                      alt={form.title}
                      width={800}
                      height={450}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>
                <div className="flex gap-3 mt-2">
                  {form.images && form.images.length > 0 && form.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative group">
                      <button
                        type="button"
                        className={`rounded-lg overflow-hidden border-2 ${mainImage === idx ? 'border-teal-500' : 'border-transparent'} focus:outline-none`}
                        onClick={() => setMainImage(idx)}
                      >
                        <Image src={img} alt={form.title} width={64} height={48} className="object-cover w-16 h-12" />
                      </button>
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-gray-500 shadow hover:bg-red-500 hover:text-white transition z-10"
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
                    className="rounded-lg border-2 border-dashed border-gray-300 w-16 h-12 flex items-center justify-center text-2xl text-gray-400 bg-gray-50 hover:border-teal-400 hover:text-teal-500 transition"
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
              <form onSubmit={handleSubmit} className="flex-1 bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
                <h2 className="text-3xl font-bold mb-4 text-gray-800">Edit Property</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="font-medium">Title
                    <input name="title" value={form.title || ''} onChange={handleChange} className="block w-full border rounded px-3 py-2 mt-1" />
                  </label>
                  <label className="font-medium">Category
                    <select name="category" value={form.category || ''} onChange={handleChange} className="block w-full border rounded px-3 py-2 mt-1">
                      <option value="">Select category</option>
                      <option value="luxury-villas">Luxury Villas</option>
                      <option value="mountain-cabins">Mountain Cabins</option>
                      <option value="tropical-homes">Tropical Homes</option>
                      <option value="city-apartments">City Apartments</option>
                      <option value="beach-houses">Beach Houses</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label className="font-medium col-span-2">Address
                    <input name="address" value={form.address || ''} onChange={handleChange} className="block w-full border rounded px-3 py-2 mt-1" />
                  </label>
                  <div className="flex gap-4">
                    <label className="font-medium flex-1">City
                      <input name="city" value={form.city || ''} onChange={handleChange} className="block w-full border rounded px-3 py-2 mt-1" />
                    </label>
                    <label className="font-medium flex-1">Country
                      <input name="country" value={form.country || ''} onChange={handleChange} className="block w-full border rounded px-3 py-2 mt-1" />
                    </label>
                  </div>
                  <label className="font-medium col-span-2">Price per night ($)
                    <input name="price" type="number" value={form.price || ''} onChange={handleChange} className="block w-full border rounded px-3 py-2 mt-1" />
                  </label>
                  <div className="flex gap-4">
                    <label className="font-medium flex-1">Bedrooms
                      <input name="bedrooms" type="number" value={form.bedrooms || ''} onChange={handleChange} className="block w-full border rounded px-3 py-2 mt-1" />
                    </label>
                    <label className="font-medium flex-1">Bathrooms
                      <input name="bathrooms" type="number" value={form.bathrooms || ''} onChange={handleChange} className="block w-full border rounded px-3 py-2 mt-1" />
                    </label>
                    <label className="font-medium flex-1">Max Guests
                      <input name="maxGuests" type="number" value={form.maxGuests || ''} onChange={handleChange} className="block w-full border rounded px-3 py-2 mt-1" />
                    </label>
                  </div>
                  <label className="font-medium col-span-2">Description
                    <textarea name="description" value={form.description || ''} onChange={handleChange} className="block w-full border rounded px-3 py-2 mt-1 min-h-[80px]" />
                  </label>
                  <div className="font-medium col-span-2">
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
                        className="block w-full border rounded px-3 py-2"
                        placeholder="Add amenity (comma separated)"
                      />
                      <button
                        type="button"
                        onClick={handleAmenityAdd}
                        className="px-3 py-2 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 transition"
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
                            className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-3 py-1 text-teal-700 text-sm"
                          >
                            {amenity}
                            <button
                              type="button"
                              onClick={() => handleAmenityRemove(amenity)}
                              className="h-5 w-5 rounded-full bg-white border border-teal-200 text-teal-700 text-xs leading-none hover:bg-red-500 hover:border-red-500 hover:text-white transition"
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
                  <button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-2 rounded-lg text-lg transition">Save Changes</button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-semibold px-5 py-2 rounded-lg text-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
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
