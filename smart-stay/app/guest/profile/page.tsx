import GuestNavbar from '@/components/navbar/GuestNavbar';

export default function GuestProfile() {
  return (
    <div className="flex min-h-screen">
      <GuestNavbar />
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        {/* Profile details and edit form */}
      </main>
    </div>
  );
}
