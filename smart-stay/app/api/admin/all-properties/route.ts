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

    // Fetch all properties with host details
    const properties = await db.collection("properties").aggregate([
      {
        $lookup: {
          from: "users",
          localField: "host",
          foreignField: "_id",
          as: "hostDetails",
        },
      },
      { $unwind: { path: "$hostDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "bookings",
          let: { propertyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$property", "$$propertyId"] },
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
        $project: {
          title: 1,
          description: 1,
          category: 1,
          city: 1,
          country: 1,
          price: 1,
          images: 1,
          status: 1,
          rating: 1,
          reviewCount: 1,
          createdAt: 1,
          bookingCount: {
            $ifNull: [{ $arrayElemAt: ["$bookingStats.count", 0] }, 0],
          },
          "hostDetails.name": 1,
          "hostDetails.email": 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]).toArray();

    return NextResponse.json({ properties });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}