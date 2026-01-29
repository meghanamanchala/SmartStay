import HostNavbar from '@/components/navbar/HostNavbar';

export default function HostBookings() {
  return (
    <div className="flex min-h-screen">
      <HostNavbar />
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Bookings</h1>
        {/* Host bookings content */}
      </main>
    </div>
  );
}
