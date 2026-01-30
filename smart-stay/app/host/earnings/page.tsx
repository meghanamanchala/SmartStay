import HostNavbar from '@/components/navbar/HostNavbar';

export default function HostEarnings() {
  return (
    <div className="flex min-h-screen">
      <HostNavbar />
      <main className="flex-1 p-8 bg-gray-50 ml-64">
        <h1 className="text-2xl font-bold mb-4">Earnings</h1>
        {/* Earnings content */}
      </main>
    </div>
  );
}
