"use client";

import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-rose-100 shadow-lg p-8 text-center">
        <div className="text-5xl mb-3">❌</div>
        <h1 className="text-3xl font-bold text-rose-700 mb-2">Payment cancelled</h1>
        <p className="text-gray-600 mb-6">No charge was made. You can try checkout again anytime.</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/guest/explore"
            className="px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
          >
            Back to explore
          </Link>
          <Link
            href="/guest/bookings"
            className="px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
          >
            View bookings
          </Link>
        </div>
      </div>
    </main>
  );
}
