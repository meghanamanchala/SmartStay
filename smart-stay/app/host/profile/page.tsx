"use client";
import HostNavbar from '@/components/navbar/HostNavbar';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, Mail, Phone, MapPin, Info, Briefcase } from 'lucide-react';
import 'react-phone-number-input/style.css';
import '../../guest/profile/phone-input-custom.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import FreePlacesInput from "@/components/FreePlacesInput";

export default function HostProfile() {
  const { status } = useSession();
  const defaultNotificationPreferences = {
    inApp: { booking: true, message: true, review: true },
  };
  const [profile, setProfile] = useState({
    name: '',
    businessName: '',
    email: '',
    profileImageUrl: '',
    phone: '',
    location: '',
    bio: '',
    createdAt: '',
    role: '', 
    notificationPreferences: defaultNotificationPreferences,
  });
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
        const res = await fetch('/api/host/profile');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        if (data.role === 'host' && data._id) {
          setProfile({
            name: data.name || '',
            businessName: data.businessName || '',
            email: data.email || '',
            profileImageUrl: data.profileImageUrl || '',
            phone: data.phone || '',
            location: data.location || '',
            bio: data.bio || '',
            createdAt: data.createdAt || '',
            role: data.role || '',
            notificationPreferences: data.notificationPreferences || defaultNotificationPreferences,
          });
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

  const handlePhoneChange = (value?: string) => {
    setProfile({ ...profile, phone: value || '' });
    setFieldErrors((prev) => ({ ...prev, phone: '' }));
  };

  const handleNotificationToggle = (key: 'booking' | 'message' | 'review', value: boolean) => {
    setProfile((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        inApp: {
          ...prev.notificationPreferences.inApp,
          [key]: value,
        },
      },
    }));
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
        autoSaveProfile(updated);
        return updated;
      });
    } catch (err) {
      setError('Could not upload image');
    }
  };

  const autoSaveProfile = async (updatedProfile: typeof profile) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/host/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedProfile.name,
          businessName: updatedProfile.businessName,
          profileImageUrl: updatedProfile.profileImageUrl,
          phone: updatedProfile.phone,
          location: updatedProfile.location,
          bio: updatedProfile.bio,
          notificationPreferences: updatedProfile.notificationPreferences,
        }),
      });
      if (!res.ok) throw new Error('Failed to save changes');
      setSuccess('Profile saved successfully!');
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
    setSuccess('');
    let errors: Record<string, string> = {};
    if (!profile.phone || !isValidPhoneNumber(profile.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/host/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          businessName: profile.businessName,
          profileImageUrl: profile.profileImageUrl,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
          notificationPreferences: profile.notificationPreferences,
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
    <div className="flex min-h-screen">
      <HostNavbar />
      <main className="flex-1 p-8 bg-gray-50 ml-64">
        <h1 className="text-2xl font-bold mb-2">Host Profile</h1>
        <p className="text-gray-500 mb-6">Manage your hosting profile and business information</p>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          <form className="max-w-xl bg-white p-8 rounded-lg shadow" onSubmit={handleSave}>
            <div className="flex items-center gap-6 mb-8">
              <div className="relative w-20 h-20">
                <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-3xl font-bold overflow-hidden cursor-pointer border-2 border-teal-400" onClick={handleImageClick} title="Change profile image">
                  {profile.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-10 h-10 text-teal-600" />
                  )}
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} />
                </div>
                {profile.profileImageUrl && (
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-white hover:bg-red-600 z-10"
                    title="Remove profile image"
                    onClick={() => {
                      setProfile((prev) => {
                        const updated = { ...prev, profileImageUrl: '' };
                        autoSaveProfile(updated);
                        return updated;
                      });
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              <div>
                <div className="font-semibold text-lg">{profile.name || 'Host User'}</div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {profile.role === 'host' && (
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-semibold">Superhost</span>
                  )}
                  <span>Host since {profile.createdAt ? new Date(profile.createdAt).getFullYear() : ''}</span>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-5 h-5 text-gray-400" />
                <input name="name" value={profile.name} onChange={handleChange} className="w-full border rounded px-10 py-2" placeholder="Full Name" />
              </div>
              {fieldErrors['name'] && <div className="text-xs text-red-500 mt-1">{fieldErrors['name']}</div>}
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Business Name (Optional)</label>
              <div className="relative flex items-center">
                <Briefcase className="absolute left-3 w-5 h-5 text-gray-400" />
                <input name="businessName" value={profile.businessName} onChange={handleChange} className="w-full border rounded px-10 py-2" placeholder="Business Name" />
              </div>
              {fieldErrors['businessName'] && <div className="text-xs text-red-500 mt-1">{fieldErrors['businessName']}</div>}
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-5 h-5 text-gray-400" />
                <input name="email" value={profile.email} disabled className="w-full border rounded px-10 py-2 bg-gray-100" placeholder="Email" />
              </div>
              <div className="text-xs text-gray-400 mt-1">Email cannot be changed</div>
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Phone Number</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3 w-5 h-5 text-gray-400" />
                <PhoneInput
                  name="phone"
                  value={profile.phone}
                  onChange={handlePhoneChange}
                  className="w-full border rounded px-10 py-2"
                  placeholder="Enter phone number"
                  defaultCountry="IN"
                  international
                  countryCallingCodeEditable={false}
                />
              </div>
              {fieldErrors['phone'] && <div className="text-xs text-red-500 mt-1">{fieldErrors['phone']}</div>}
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Location</label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 w-5 h-5 text-gray-400" />
                <FreePlacesInput
                  value={profile.location}
                  className="pl-10"
                  onChange={(val: string) =>
                    setProfile({ ...profile, location: val })
                  }
                />
                {fieldErrors['location'] && <div className="text-xs text-red-500 mt-1">{fieldErrors['location']}</div>}
              </div>
              <div className="mb-4 mt-4">
                <label className="block font-medium mb-1">Bio</label>
                <textarea name="bio" value={profile.bio} onChange={handleChange} className="w-full border rounded px-10 py-2 mt-0" rows={3} />
              </div>
            </div>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">{success}</div>}
            <button type="submit" className="bg-teal-500 text-white px-6 py-2 rounded font-semibold hover:bg-teal-600" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
