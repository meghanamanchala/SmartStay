import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify admin role
    const currentUser = await db.collection("users").findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recentUsers = await db.collection("users")
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Total revenue from confirmed, checked-in, and completed bookings
    const revenueAgg = await db.collection("bookings").aggregate([
      { $match: { status: { $in: ["confirmed", "checked-in", "completed"] } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]).toArray();
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Last 12 months for revenue data
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    
    const bookingTrends = await db.collection("bookings").aggregate([
      { 
        $match: { 
          createdAt: { $gte: twelveMonthsAgo },
          status: { $in: ["confirmed", "checked-in", "completed"] }
        } 
      },
      { 
        $group: {
          _id: { 
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" } 
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]).toArray();

    return NextResponse.json({
      recentUsers,
      totalRevenue,
      bookingTrends,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
