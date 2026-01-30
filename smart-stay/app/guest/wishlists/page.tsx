import GuestNavbar from '@/components/navbar/GuestNavbar';

export default function GuestWishlists() {
  return (
    <div className="flex min-h-screen">
      <GuestNavbar />
      <main className="flex-1 p-8 bg-gray-50 ml-64">
        <h1 className="text-2xl font-bold mb-4">Wishlists</h1>
        {/* Wishlists content here */}
      </main>
    </div>
  );
}
