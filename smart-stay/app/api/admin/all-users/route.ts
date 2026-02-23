import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
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

    // Fetch all users (excluding passwords) with booking counts
    const users = await db.collection("users").aggregate([
      {
        $lookup: {
          from: "bookings",
          let: {
            userId: "$_id",
            userIdString: { $toString: "$_id" },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$guest", "$$userId"] },
                    { $eq: ["$guest", "$$userIdString"] },
                  ],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "bookingStats",
        },
      },
      {
        $addFields: {
          bookingCount: {
            $ifNull: [{ $arrayElemAt: ["$bookingStats.count", 0] }, 0],
          },
        },
      },
      {
        $project: {
          password: 0,
          bookingStats: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ]).toArray();

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}