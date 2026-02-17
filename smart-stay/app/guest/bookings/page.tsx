"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { CalendarDays, MapPin, Moon } from "lucide-react";
import GuestNavbar from "@/components/navbar/GuestNavbar";
import { useRouter } from "next/navigation";

export default function GuestBookings() {
  const { status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      try {
        const res = await fetch("/api/guest/bookings");
        if (!res.ok) throw new Error("Failed to fetch bookings");
        const data = await res.json();
        setBookings(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="rounded-2xl border border-gray-100 bg-white px-8 py-6 shadow-lg text-gray-600 font-medium">
          Loading bookings...
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
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
      <GuestNavbar />
      <main className="flex-1 p-6 md:p-10 ml-0 md:ml-64">
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h1 className="text-4xl font-extrabold mb-1 text-teal-600">Your Bookings</h1>
          <p className="text-gray-600 font-medium">View and manage your reservations</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-8 shadow text-gray-500">
            Loading bookings...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 py-14 text-center">
            <p className="text-lg font-semibold text-gray-700">No bookings found</p>
            <p className="text-sm text-gray-500 mt-1">Your reservations will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {bookings.map((b) => {
              const checkOutDate = new Date(b.checkOut);
              const today = new Date();
              checkOutDate.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
              const canReview = checkOutDate < today;
              const alreadyReviewed = b.reviewed || b.review;

              return (
                <div
                  key={b._id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col md:flex-row gap-6 p-6 items-start relative"
                >
                  <div className="w-full md:w-64 h-44 relative flex-shrink-0">
                    {b.property?.images?.[0] ? (
                      <Image
                        src={b.property.images[0]}
                        alt={b.property.title}
                        fill
                        className="object-cover rounded-xl border border-gray-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 rounded-xl border border-gray-200">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">{b.property?.title}</h2>
                      <div className="text-gray-500 text-sm flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {b.property?.city}, {b.property?.country}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-gray-700">
                        <div className="flex items-center gap-1 font-medium mb-1">
                          <CalendarDays className="h-4 w-4 text-teal-600" /> Check-in
                        </div>
                        <div className="text-gray-900">{formatDate(b.checkIn)}</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-gray-700">
                        <div className="flex items-center gap-1 font-medium mb-1">
                          <CalendarDays className="h-4 w-4 text-teal-600" /> Check-out
                        </div>
                        <div className="text-gray-900">{formatDate(b.checkOut)}</div>
                      </div>
                      <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-gray-700">
                        <div className="flex items-center gap-1 font-medium mb-1">
                          <Moon className="h-4 w-4 text-teal-600" /> Duration
                        </div>
                        <div className="text-gray-900">{getNights(b.checkIn, b.checkOut)} nights</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-500 text-sm">Total Price</div>
                      <div className="text-2xl font-bold text-teal-600">${b.totalPrice}</div>
                    </div>

                    {showReviewForm === b._id && canReview && !alreadyReviewed && (
                      <form
                        className="mt-1 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-3"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setSubmittingReview(true);
                          setReviewError("");
                          try {
                            const res = await fetch("/api/guest/reviews", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                bookingId: b._id,
                                propertyId: b.property?._id,
                                rating: reviewRating,
                                comment: reviewComment,
                              }),
                            });
                            if (!res.ok) {
                              const data = await res.json();
                              throw new Error(data.error || "Failed to submit review");
                            }
                            setBookings((prev) =>
                              prev.map((bk) => (bk._id === b._id ? { ...bk, reviewed: true } : bk))
                            );
                            setShowReviewForm(null);
                            setReviewRating(5);
                            setReviewComment("");
                          } catch (err: any) {
                            setReviewError(err.message || "Failed to submit review");
                          } finally {
                            setSubmittingReview(false);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <label className="font-semibold text-gray-700">Rating:</label>
                          <select
                            value={reviewRating}
                            onChange={(e) => setReviewRating(Number(e.target.value))}
                            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                            required
                          >
                            {[5, 4, 3, 2, 1].map((r) => (
                              <option key={r} value={r}>
                                {r} Star{r > 1 ? "s" : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <textarea
                          className="border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                          rows={3}
                          placeholder="Write your review..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          required
                        />

                        {reviewError && <div className="text-red-600 text-sm">{reviewError}</div>}

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-70"
                            disabled={submittingReview}
                          >
                            {submittingReview ? "Submitting..." : "Submit Review"}
                          </button>
                          <button
                            type="button"
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                            onClick={() => setShowReviewForm(null)}
                            disabled={submittingReview}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  <div className="absolute top-6 right-6">
                    {canReview ? (
                      alreadyReviewed ? (
                        <span className="bg-gray-100 text-gray-600 px-4 py-1 rounded-full text-sm font-semibold border border-gray-200">
                          Reviewed
                        </span>
                      ) : (
                        <button
                          className="bg-amber-100 text-amber-700 px-4 py-1 rounded-full text-sm font-semibold hover:bg-amber-200 border border-amber-200 transition"
                          onClick={() => {
                            setShowReviewForm(b._id);
                            setReviewRating(5);
                            setReviewComment("");
                          }}
                        >
                          Leave Review
                        </button>
                      )
                    ) : (
                      <span className="bg-teal-100 text-teal-700 px-4 py-1 rounded-full text-sm font-semibold border border-teal-200">
                        Upcoming
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-6 right-6">
                    <button
                      className="text-teal-600 font-semibold hover:underline"
                      onClick={() => router.push(`/guest/bookings/${b._id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function getNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diff = outDate.getTime() - inDate.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}
