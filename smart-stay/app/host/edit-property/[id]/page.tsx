"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import HostNavbar from '@/components/navbar/HostNavbar';
import Image from 'next/image';


export default function EditHostProperty() {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({});
  const router = useRouter();
  const [mainImage, setMainImage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Handle image upload (local preview only, not persisted)
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
    if (!id) return;
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/host/properties`);
        if (!res.ok) throw new Error("Failed to fetch property");
        const data = await res.json();
        const found = data.find((p: any) => p._id === id);
        setProperty(found);
        setForm(found);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    // TODO: Implement update API
    alert('Update functionality not implemented.');
  };

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
                    <label className="font-medium flex-1">Max Guests
                      <input name="maxGuests" type="number" value={form.maxGuests || ''} onChange={handleChange} className="block w-full border rounded px-3 py-2 mt-1" />
                    </label>
                  </div>
                  <label className="font-medium col-span-2">Description
                    <textarea name="description" value={form.description || ''} onChange={handleChange} className="block w-full border rounded px-3 py-2 mt-1 min-h-[80px]" />
                  </label>
                </div>
                <div className="flex gap-4 mt-4">
                  <button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-2 rounded-lg text-lg transition">Save Changes</button>
                  <button type="button" className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-semibold px-5 py-2 rounded-lg text-lg transition">Delete</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
