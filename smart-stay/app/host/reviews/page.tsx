"use client";

import HostNavbar from '@/components/navbar/HostNavbar';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Star, User, MessageCircle } from 'lucide-react';
import Image from 'next/image';

export default function HostReviews() {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const res = await fetch('/api/host/reviews');
        if (!res.ok) throw new Error('Failed to fetch reviews');
        const data = await res.json();
        setSummary(data.summary);
        setReviews(data.reviews);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchReviews();
  }, [status]);

  if (status === 'loading' || loading) {
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

  return (
    <div className="flex min-h-screen">
      <HostNavbar />
      <main className="flex-1 p-8 bg-gray-50 ml-64">
        <h1 className="text-3xl font-bold mb-1">Reviews</h1>
        <p className="text-gray-500 mb-6">See what guests are saying about your properties</p>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {summary && (
          <div className="flex gap-6 mb-8">
            <div className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <Star className="w-8 h-8 text-yellow-400 mb-1" fill="#facc15" />
              <div className="text-4xl font-bold">{summary.averageRating}</div>
              <div className="text-gray-500">Average Rating</div>
            </div>
            <div className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <MessageCircle className="w-8 h-8 text-teal-500 mb-1" />
              <div className="text-4xl font-bold">{summary.totalReviews}</div>
              <div className="text-gray-500">Total Reviews</div>
            </div>
            <div className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <Star className="w-8 h-8 text-yellow-400 mb-1" fill="#facc15" />
              <div className="text-4xl font-bold">{summary.fiveStarReviews}</div>
              <div className="text-gray-500">5-Star Reviews</div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {reviews.length === 0 ? (
            <div className="text-gray-500">No reviews yet.</div>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="bg-white rounded-2xl shadow flex flex-col md:flex-row gap-6 p-6 items-start relative">
                <div className="w-20 h-20 relative flex-shrink-0">
                  {r.guest?.image ? (
                    <Image src={r.guest.image} alt={r.guest.name || 'Guest'} fill className="object-cover rounded-full" />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded-full">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{r.guest?.name || 'Guest'}</span>
                    <span className="text-yellow-400 flex items-center gap-0.5">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="w-4 h-4" fill={star <= r.rating ? '#facc15' : 'none'} />
                      ))}
                    </span>
                    <span className="text-gray-400 text-xs ml-2">{r.property?.title || ''} • {formatDate(r.date)}</span>
                  </div>
                  <div className="mb-2 text-gray-700">{r.comment}</div>
                  {r.reply && (
                    <div className="bg-teal-50 border-l-4 border-teal-400 p-2 rounded text-sm text-teal-800 mt-2">
                      <span className="font-semibold">Your reply:</span> {r.reply}
                    </div>
                  )}
                </div>
                <div className="absolute top-6 right-6">
                  {r.reply ? (
                    <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-xs font-semibold">Replied</span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
