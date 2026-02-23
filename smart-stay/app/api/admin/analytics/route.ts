import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const db = client.db();

  // Recent 5 users (excluding password)
  const recentUsers = await db.collection("users")
    .find({}, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  // Revenue: sum of all bookings' price (assuming bookings have a 'totalPrice' field)
  const revenueAgg = await db.collection("bookings").aggregate([
    { $group: { _id: null, total: { $sum: "$totalPrice" } } }
  ]).toArray();
  const totalRevenue = revenueAgg[0]?.total || 0;

  // Booking trends: count bookings per month for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const trends = await db.collection("bookings").aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: {
      _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
      count: { $sum: 1 }
    }},
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]).toArray();

  return NextResponse.json({
    recentUsers,
    totalRevenue,
    bookingTrends: trends
  });
}
