'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import GuestNavbar from '@/components/navbar/GuestNavbar';
import { Star, MessageSquare, Calendar, Home, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ReviewItem {
  _id: string;
  property: {
    _id: string;
    title: string;
    images?: string[];
    city?: string;
    country?: string;
  };
  rating: number;
  comment: string;
  date: string;
}

export default function GuestReviewsPage() {
  const { status } = useSession();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');

  useEffect(() => {
    fetchGuestReviews();
  }, []);

  const fetchGuestReviews = async () => {
    try {
      const response = await fetch('/api/guest/reviews');
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const response = await fetch(`/api/guest/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete review');
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    }
  };

  const filteredReviews = reviews.filter((r) => filter === 'all' || r.rating === filter);

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingBg = (rating: number) => {
    if (rating >= 4) return 'bg-green-50';
    if (rating >= 3) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="rounded-2xl border border-gray-100 bg-white px-8 py-6 shadow-lg text-gray-600 font-medium">
          Loading reviews...
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need to log in to view your reviews.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      <GuestNavbar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">My Reviews</h1>
            </div>
            <p className="text-gray-600">Manage and view all the reviews you've left for properties</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-gray-600 text-sm font-medium">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{reviews.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
              <p className="text-green-600 text-sm font-medium">5-Star Reviews</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{reviews.filter((r) => r.rating === 5).length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-gray-600 text-sm font-medium">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {reviews.length > 0
                  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                  : '—'}
              </p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-700 mb-3">Filter by Rating</p>
            <div className="flex gap-3 flex-wrap">
              {(['all', 5, 4, 3, 2, 1] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 rounded-xl font-medium transition ${
                    filter === f
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-teal-400 hover:bg-teal-50'
                  }`}
                >
                  {f === 'all' ? 'All' : `${f} ★`}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 mb-8">
              {error}
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {loading && (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-3">
                  <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                  <span className="text-gray-600 font-medium">Loading your reviews...</span>
                </div>
              </div>
            )}

            {!loading && filteredReviews.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="inline-block p-4 bg-gray-100 rounded-2xl mb-4">
                  <MessageSquare className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-800 font-semibold text-lg">No reviews yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  {reviews.length === 0 
                    ? "Start booking and sharing your feedback with hosts!"
                    : "No reviews match this filter"}
                </p>
              </div>
            )}

            {filteredReviews.map((review) => (
              <div
                key={review._id}
                className={`group bg-white rounded-2xl border overflow-hidden transition hover:shadow-lg ${getRatingBg(review.rating)} border-gray-100`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Property Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {review.property?.images?.[0] && (
                        <img
                          src={review.property.images[0]}
                          alt={review.property.title}
                          className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/guest/explore/${review.property._id}`}
                          className="hover:text-teal-600 transition"
                        >
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            {review.property?.title || 'Property'}
                          </h3>
                        </Link>
                        
                        {review.property?.city && (
                          <p className="text-gray-600 text-sm mb-3 flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            {review.property.city}
                            {review.property.country && `, ${review.property.country}`}
                          </p>
                        )}

                        {/* Rating */}
                        <div className="mb-3">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold ${getRatingColor(review.rating)}`}>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span>{review.rating}/5</span>
                          </div>
                        </div>

                        {/* Review Text */}
                        <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>

                        {/* Date */}
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(review.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                      title="Delete review"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
