"use client";

import GuestNavbar from '@/components/navbar/GuestNavbar';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, Shield } from 'lucide-react';
import FreePlacesInput from "@/components/FreePlacesInput";

type GuestProfileState = {
  name: string;
  email: string;
  profileImageUrl: string;
  phone: string;
  location: string;
  bio: string;
  createdAt: string;
  notificationPreferences: {
    inApp: {
      booking: boolean;
      message: boolean;
      review: boolean;
    };
  };
};

export default function GuestProfile() {
  const { status } = useSession();
  const defaultNotificationPreferences = {
    inApp: { booking: true, message: true, review: true },
  };
  const [profile, setProfile] = useState<GuestProfileState>({
    name: '',
    email: '',
    profileImageUrl: '',
    phone: '',
    location: '',
    bio: '',
    createdAt: '',
    notificationPreferences: defaultNotificationPreferences,
  });
  const [initialProfile, setInitialProfile] = useState<GuestProfileState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch('/api/guest/profile');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        if (data.role === 'guest' && data._id) {
          const nextProfile: GuestProfileState = {
            name: data.name || '',
            email: data.email || '',
            profileImageUrl: data.profileImageUrl || '',
            phone: data.phone || '',
            location: data.location || '',
            bio: data.bio || '',
            createdAt: data.createdAt || '',
            notificationPreferences: data.notificationPreferences || defaultNotificationPreferences,
          };
          setProfile(nextProfile);
          setInitialProfile(nextProfile);
        } else {
          setError('You are not authorized to view this profile.');
        }
      } catch (err) {
        setError('Could not load profile');
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, phone: e.target.value });
    setFieldErrors((prev) => ({ ...prev, phone: '' }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Image upload failed');
      const data = await res.json();
      setProfile((prev) => {
        const updated = { ...prev, profileImageUrl: data.secure_url };
        // Auto-save after image upload
        autoSaveProfile(updated);
        return updated;
      });
    } catch (err) {
      setError('Could not upload image');
    }
  };

  // Auto-save helper
  const autoSaveProfile = async (updatedProfile: GuestProfileState) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/guest/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedProfile.name,
          profileImageUrl: updatedProfile.profileImageUrl,
          phone: updatedProfile.phone,
          location: updatedProfile.location,
          bio: updatedProfile.bio,
        }),
      });
      if (!res.ok) throw new Error('Failed to save changes');
    } catch (err) {
      setError('Could not auto-save profile after image upload');
    }
    setSaving(false);
  };

  const handleImageClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    let errors: Record<string, string> = {};
    if (!profile.phone || !/^\+?[0-9\s()-]{8,20}$/.test(profile.phone.trim())) {
      errors.phone = 'Please enter a valid phone number';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSaving(true);
    setSuccess('');
    try {
      const res = await fetch('/api/guest/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          profileImageUrl: profile.profileImageUrl,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
        }),
      });
      if (!res.ok) throw new Error('Failed to save changes');
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Could not save changes');
    }
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <GuestNavbar />
      <main className="flex-1 ml-64 p-4 lg:p-6">
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : error && !profile.email ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          <form className="max-w-3xl bg-white rounded-2xl shadow border border-gray-200 overflow-hidden" onSubmit={handleSave}>
            <div className="h-32 bg-gradient-to-r from-teal-400 to-teal-500" />

            <div className="px-5 md:px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 -mt-10 mb-6">
                <div className="flex items-end gap-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleImageClick}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gray-200 border-4 border-white shadow flex items-center justify-center overflow-hidden"
                      title="Change profile image"
                    >
                      {profile.profileImageUrl ? (
                        <img src={profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-teal-500" />
                      )}
                    </button>
                    {profile.profileImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfile((prev) => {
                            const updated = { ...prev, profileImageUrl: '' };
                            autoSaveProfile(updated);
                            return updated;
                          });
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white border-2 border-white shadow flex items-center justify-center hover:bg-red-600 text-sm font-bold leading-none"
                        title="Remove profile image"
                      >
                        ×
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleImageClick}
                      className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-teal-500 text-white border-2 border-white shadow flex items-center justify-center hover:bg-teal-600"
                      title="Upload photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} />
                  </div>

                  <div className="pb-1">
                    <h2 className="text-2xl font-bold text-gray-800 leading-tight">{profile.name || 'Guest User'}</h2>
                    <div className="mt-1 flex items-center gap-2 text-gray-500">
                      <Shield className="w-4 h-4 text-teal-500" />
                      <span className="text-base">
                        {profile.createdAt
                          ? `Guest since ${new Date(profile.createdAt).getFullYear()}`
                          : 'Guest since'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="name"
                      value={profile.name}
                      onChange={handleChange}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
                      placeholder="Full Name"
                    />
                  </div>
                  {fieldErrors['name'] && <div className="text-xs text-red-500 mt-1">{fieldErrors['name']}</div>}
                </div>

                <div>
                  <label className="block text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="email"
                      value={profile.email}
                      disabled
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-base text-gray-400"
                      placeholder="Email"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Email cannot be changed</div>
                </div>

                <div>
                  <label className="block text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      name="phone"
                      value={profile.phone}
                      onChange={handlePhoneChange}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
                      placeholder="Enter phone number"
                    />
                  </div>
                  {fieldErrors['phone'] && <div className="text-xs text-red-500 mt-1">{fieldErrors['phone']}</div>}
                </div>

                <div>
                  <label className="block text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <FreePlacesInput
                      value={profile.location}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
                      onChange={(val: string) => setProfile({ ...profile, location: val })}
                    />
                  </div>
                  {fieldErrors['location'] && <div className="text-xs text-red-500 mt-1">{fieldErrors['location']}</div>}
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-xs font-bold tracking-wide text-gray-500 uppercase mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  rows={3}
                />
              </div>

              {(error || success) && (
                <div className="mt-4">
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  {success && <div className="text-green-600 text-sm">{success}</div>}
                </div>
              )}

              <div className="mt-6 border-t border-gray-200 pt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!initialProfile) return;
                    setProfile(initialProfile);
                    setFieldErrors({});
                    setSuccess('');
                    setError('');
                  }}
                  className="h-10 px-6 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium text-sm"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-70 text-sm"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
