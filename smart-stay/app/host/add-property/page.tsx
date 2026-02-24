"use client";

import HostNavbar from '@/components/navbar/HostNavbar';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AddProperty() {
  const { status } = useSession();
  const [amenity, setAmenity] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    address: '',
    city: '',
    country: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    maxGuests: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();

  const handleAmenityAdd = () => {
    const parts = amenity
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    setAmenities((prev) => {
      const existing = new Set(prev.map((a) => a.toLowerCase()));
      const toAdd = parts.filter((item) => !existing.has(item.toLowerCase()));
      return [...prev, ...toAdd];
    });

    setAmenity('');
  };

  const handleAmenityRemove = (item: string) => {
    setAmenities((prev) => prev.filter((a) => a !== item));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 10);
      setImages(files);
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    if (images.length > 0) {
      const urls = images.map((file) => URL.createObjectURL(file));
      setImagePreviews(urls);
      return () => urls.forEach(url => URL.revokeObjectURL(url));
    } else {
      setImagePreviews([]);
    }
  }, [images]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);
    let imageUrls: string[] = [];
    try {
      if (images.length > 0) {
        setUploading(true);
        let uploaded = 0;
        for (const img of images) {
          const formData = new FormData();
          formData.append('file', img);
          const res = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) {
            throw new Error('Image upload failed');
          }
          const data = await res.json();
          imageUrls.push(data.secure_url);
          uploaded++;
          setUploadProgress(Math.round((uploaded / images.length) * 100));
        }
        setUploading(false);
      }
      const res = await fetch('/api/host/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          maxGuests: Number(form.maxGuests),
          amenities,
          images: imageUrls,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add property');
      }
      setSuccess('Property added successfully!');
      setTimeout(() => router.push('/host/properties'), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-teal-600 font-semibold">Loading...</div>;
  }
  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow text-center border border-gray-100">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You are not authorized to view this page.</p>
          <a href="/auth/login" className="text-teal-500 font-semibold hover:underline">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <HostNavbar />
      <main className="flex-1 p-8 lg:p-10 ml-64">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-teal-100 bg-white/85 backdrop-blur-sm p-6 shadow-sm mb-6">
            <h1 className="text-3xl font-extrabold text-teal-700">Add New Property</h1>
            <p className="text-gray-500 mt-1 font-medium">List your property and start earning</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <section className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6 mb-6">
              <h2 className="font-bold text-lg text-teal-700 mb-4">Basic Information</h2>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Property Title</label>
                <input name="title" value={form.title} onChange={handleChange} type="text" placeholder="e.g., Cozy Beach House with Ocean View" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe your property..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Property Category</label>
                <select name="category" value={form.category} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white" required>
                  <option value="">Select category</option>
                  <option value="luxury-villas">Luxury Villas</option>
                  <option value="mountain-cabins">Mountain Cabins</option>
                  <option value="tropical-homes">Tropical Homes</option>
                  <option value="city-apartments">City Apartments</option>
                  <option value="beach-houses">Beach Houses</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </section>

            {/* Location */}
            <section className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6 mb-6">
              <h2 className="font-bold text-lg text-teal-700 mb-4">Location</h2>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Address</label>
                <input name="address" value={form.address} onChange={handleChange} type="text" placeholder="Street address" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                  <input name="city" value={form.city} onChange={handleChange} type="text" placeholder="City" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                  <input name="country" value={form.country} onChange={handleChange} type="text" placeholder="Country" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white" required />
                </div>
              </div>
            </section>

            {/* Pricing & Capacity */}
            <section className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6 mb-6">
              <h2 className="font-bold text-lg text-teal-700 mb-4">Pricing & Capacity</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-1">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price/Night ($)</label>
                  <input name="price" value={form.price} onChange={handleChange} type="number" min="0" placeholder="$ 100" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Bedrooms</label>
                  <input name="bedrooms" value={form.bedrooms} onChange={handleChange} type="number" min="1" placeholder="1" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Bathrooms</label>
                  <input name="bathrooms" value={form.bathrooms} onChange={handleChange} type="number" min="1" placeholder="1" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Max Guests</label>
                  <input name="maxGuests" value={form.maxGuests} onChange={handleChange} type="number" min="1" placeholder="2" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white" required />
                </div>
              </div>
            </section>

            {/* Amenities */}
            <section className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6 mb-6">
              <h2 className="font-bold text-lg text-teal-700 mb-4">Amenities</h2>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add amenity (e.g., WiFi, Pool)"
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  value={amenity}
                  onChange={e => setAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAmenityAdd();
                    }
                  }}
                />
                <button
                  type="button"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-semibold transition"
                  onClick={handleAmenityAdd}
                >
                  +
                </button>
              </div>
              <div className="text-sm text-gray-500">
                {amenities.length === 0 ? (
                  'No amenities added yet'
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((a, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-3 py-1 text-teal-700"
                      >
                        {a}
                        <button
                          type="button"
                          onClick={() => handleAmenityRemove(a)}
                          className="h-5 w-5 rounded-full bg-white border border-teal-200 text-teal-700 text-xs leading-none hover:bg-red-500 hover:border-red-500 hover:text-white transition"
                          title={`Remove ${a}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Property Images */}
            <section className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6 mb-6">
              <h2 className="font-bold text-lg text-teal-700 mb-4">Property Images</h2>
              <div className="border-2 border-dashed border-teal-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-teal-50/40">
                <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-4 4m4-4l4 4m-8 4h8" /></svg>
                <p className="text-gray-500 mb-2">Drag and drop images here, or click to browse</p>
                <p className="text-xs text-gray-400 mb-4">Maximum 10 images, 5MB each</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="property-images"
                  onChange={handleImageChange}
                />
                <label htmlFor="property-images" className="bg-white border border-gray-300 px-4 py-2 rounded-xl cursor-pointer font-medium hover:bg-gray-100 transition">Choose Files</label>
                <div className="mt-2 text-sm text-gray-500">
                  {images.length > 0 && `${images.length} image(s) selected`}
                </div>
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4 justify-center">
                    {imagePreviews.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="w-24 h-16 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-gray-500 shadow group-hover:opacity-100 opacity-80 hover:bg-red-500 hover:text-white transition"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button type="submit" disabled={loading || uploading} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed">
                {uploading ? `Uploading Images... (${uploadProgress}%)` : loading ? 'Adding...' : 'Add Property'}
              </button>
              <button type="button" className="bg-white border border-gray-300 text-gray-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-100 transition" onClick={() => router.push('/host/properties')}>Cancel</button>
            </div>
            {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">{error}</div>}
            {success && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm">{success}</div>}
          </form>
        </div>
      </main>
    </div>
  );
}
