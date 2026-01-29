import HostNavbar from '@/components/navbar/HostNavbar';

export default function HostDashboard() {
  return (
    <div className="flex min-h-screen">
      <HostNavbar />
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Host Dashboard 🏡</h1>
        {/* Host dashboard content: stats, earnings, recent bookings, etc. */}
      </main>
    </div>
  );
}
