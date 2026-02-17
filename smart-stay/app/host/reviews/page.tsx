"use client";

import HostNavbar from "@/components/navbar/HostNavbar";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Star, User, MessageCircle } from "lucide-react";
import Image from "next/image";

export default function HostReviews() {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const res = await fetch("/api/host/reviews");
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        setSummary(data.summary);
        setReviews(data.reviews);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") fetchReviews();
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="rounded-2xl border border-gray-100 bg-white px-8 py-6 shadow-lg text-gray-600 font-medium">
          Loading reviews...
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You are not authorized to view this page.</p>
          <a href="/auth/login" className="text-teal-600 font-semibold hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      <HostNavbar />
      <main className="flex-1 p-10 ml-64">
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            Reviews
          </h1>
          <p className="text-gray-600 font-medium">
            See what guests are saying about your properties
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col items-center">
              <Star className="w-8 h-8 text-yellow-400 mb-2" fill="#facc15" />
              <div className="text-4xl font-bold text-gray-800">{summary.averageRating}</div>
              <div className="text-gray-500 font-medium">Average Rating</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col items-center">
              <MessageCircle className="w-8 h-8 text-teal-500 mb-2" />
              <div className="text-4xl font-bold text-gray-800">{summary.totalReviews}</div>
              <div className="text-gray-500 font-medium">Total Reviews</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col items-center">
              <Star className="w-8 h-8 text-yellow-400 mb-2" fill="#facc15" />
              <div className="text-4xl font-bold text-gray-800">{summary.fiveStarReviews}</div>
              <div className="text-gray-500 font-medium">5-Star Reviews</div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {reviews.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-lg py-14 text-center">
              <p className="text-lg font-semibold text-gray-700">No reviews yet</p>
              <p className="text-sm text-gray-500 mt-1">New guest feedback will appear here.</p>
            </div>
          ) : (
            reviews.map((r) => (
              <div
                key={r._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col md:flex-row gap-6 p-6 items-start relative"
              >
                <div className="w-20 h-20 relative flex-shrink-0">
                  {r.guest?.image ? (
                    <Image
                      src={r.guest.image}
                      alt={r.guest.name || "Guest"}
                      fill
                      className="object-cover rounded-full border border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 flex items-center justify-center rounded-full border border-gray-200">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-lg text-gray-800">
                      {r.guest?.name || "Guest"}
                    </span>
                    <span className="text-yellow-400 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="w-4 h-4"
                          fill={star <= r.rating ? "#facc15" : "none"}
                        />
                      ))}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {r.property?.title || ""} • {formatDate(r.date)}
                    </span>
                  </div>

                  <div className="text-gray-700 leading-relaxed">{r.comment}</div>

                  {r.reply && (
                    <div className="bg-teal-50 border-l-4 border-teal-400 p-3 rounded text-sm text-teal-800 mt-1">
                      <span className="font-semibold">Your reply:</span> {r.reply}
                    </div>
                  )}
                </div>

                {r.reply && (
                  <div className="absolute top-6 right-6">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold border border-green-200">
                      Replied
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
