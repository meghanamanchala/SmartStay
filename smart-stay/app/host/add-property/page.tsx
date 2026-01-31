"use client";

import HostNavbar from '@/components/navbar/HostNavbar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AddProperty() {
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
    if (amenity && !amenities.includes(amenity)) {
      setAmenities([...amenities, amenity]);
      setAmenity('');
    }
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

  return (
    <div className="flex min-h-screen">
      <HostNavbar />
      <main className="flex-1 p-8 bg-gray-50 ml-64">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">Add New Property</h1>
          <p className="text-gray-500 mb-6">List your property and start earning</p>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <section className="bg-white rounded-xl shadow p-6 mb-6">
              <h2 className="font-semibold text-lg mb-4">Basic Information</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Property Title</label>
                <input name="title" value={form.title} onChange={handleChange} type="text" placeholder="e.g., Cozy Beach House with Ocean View" className="w-full border rounded-lg px-4 py-2 focus:outline-teal-500" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe your property..." className="w-full border rounded-lg px-4 py-2 min-h-[60px] focus:outline-teal-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Property Category</label>
                <select name="category" value={form.category} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 focus:outline-teal-500" required>
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
            <section className="bg-white rounded-xl shadow p-6 mb-6">
              <h2 className="font-semibold text-lg mb-4">Location</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Full Address</label>
                <input name="address" value={form.address} onChange={handleChange} type="text" placeholder="Street address" className="w-full border rounded-lg px-4 py-2 focus:outline-teal-500" required />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input name="city" value={form.city} onChange={handleChange} type="text" placeholder="City" className="w-full border rounded-lg px-4 py-2 focus:outline-teal-500" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input name="country" value={form.country} onChange={handleChange} type="text" placeholder="Country" className="w-full border rounded-lg px-4 py-2 focus:outline-teal-500" required />
                </div>
              </div>
            </section>

            {/* Pricing & Capacity */}
            <section className="bg-white rounded-xl shadow p-6 mb-6">
              <h2 className="font-semibold text-lg mb-4">Pricing & Capacity</h2>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Price/Night ($)</label>
                  <input name="price" value={form.price} onChange={handleChange} type="number" min="0" placeholder="$ 100" className="w-full border rounded-lg px-4 py-2 focus:outline-teal-500" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Bedrooms</label>
                  <input name="bedrooms" value={form.bedrooms} onChange={handleChange} type="number" min="1" placeholder="1" className="w-full border rounded-lg px-4 py-2 focus:outline-teal-500" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Bathrooms</label>
                  <input name="bathrooms" value={form.bathrooms} onChange={handleChange} type="number" min="1" placeholder="1" className="w-full border rounded-lg px-4 py-2 focus:outline-teal-500" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Max Guests</label>
                  <input name="maxGuests" value={form.maxGuests} onChange={handleChange} type="number" min="1" placeholder="2" className="w-full border rounded-lg px-4 py-2 focus:outline-teal-500" required />
                </div>
              </div>
            </section>

            {/* Amenities */}
            <section className="bg-white rounded-xl shadow p-6 mb-6">
              <h2 className="font-semibold text-lg mb-4">Amenities</h2>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add amenity (e.g., WiFi, Pool)"
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-teal-500"
                  value={amenity}
                  onChange={e => setAmenity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAmenityAdd()}
                />
                <button
                  type="button"
                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold"
                  onClick={handleAmenityAdd}
                >
                  +
                </button>
              </div>
              <div className="text-sm text-gray-500">
                {amenities.length === 0 ? 'No amenities added yet' : amenities.map((a, i) => (
                  <span key={i} className="inline-block bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2 text-gray-700">{a}</span>
                ))}
              </div>
            </section>

            {/* Property Images */}
            <section className="bg-white rounded-xl shadow p-6 mb-6">
              <h2 className="font-semibold text-lg mb-4">Property Images</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center bg-gray-50">
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
                <label htmlFor="property-images" className="bg-white border border-gray-300 px-4 py-2 rounded-lg cursor-pointer font-medium hover:bg-gray-100">Choose Files</label>
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
            <div className="flex gap-4 mt-6">
              <button type="submit" disabled={loading || uploading} className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-2 rounded-lg shadow disabled:opacity-60">
                {uploading ? `Uploading Images... (${uploadProgress}%)` : loading ? 'Adding...' : 'Add Property'}
              </button>
              <button type="button" className="bg-white border border-gray-300 text-gray-700 font-semibold px-6 py-2 rounded-lg" onClick={() => router.push('/host/properties')}>Cancel</button>
            </div>
            {error && <div className="text-red-500 mt-4">{error}</div>}
            {success && <div className="text-green-600 mt-4">{success}</div>}
          </form>
        </div>
      </main>
    </div>
  );
}
