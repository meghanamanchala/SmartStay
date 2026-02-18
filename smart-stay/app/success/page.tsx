"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-emerald-100 shadow-lg p-8 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-3xl font-bold text-emerald-700 mb-2">Payment successful</h1>
        <p className="text-gray-600 mb-5">Your checkout completed successfully on SmartStay.</p>
        {sessionId ? (
          <p className="text-xs text-gray-400 mb-6 break-all">Session: {sessionId}</p>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/guest/bookings"
            className="px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
          >
            View bookings
          </Link>
          <Link
            href="/guest/explore"
            className="px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
          >
            Continue exploring
          </Link>
        </div>
      </div>
    </main>
  );
}

