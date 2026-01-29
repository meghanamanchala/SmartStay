import HostNavbar from '@/components/navbar/HostNavbar';

export default function AddProperty() {
  return (
    <div className="flex min-h-screen">
      <HostNavbar />
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Add Property</h1>
        {/* Add property form */}
      </main>
    </div>
  );
}
