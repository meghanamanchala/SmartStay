import GuestNavbar from '@/components/navbar/GuestNavbar';

export default function GuestDashboard() {
  return (
    <div className="flex min-h-screen">
      <GuestNavbar />
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Welcome back! 👋</h1>
        {/* Dashboard content: stats, quick search, recently viewed, etc. */}
      </main>
    </div>
  );
}
