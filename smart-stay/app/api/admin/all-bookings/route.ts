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

    // Fetch all bookings with guest and property details
    const bookings = await db.collection("bookings").aggregate([
      {
        $addFields: {
          guestObjectId: {
            $convert: {
              input: "$guest",
              to: "objectId",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "guestObjectId",
          foreignField: "_id",
          as: "guestDetails",
        },
      },
      { $unwind: { path: "$guestDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "properties",
          localField: "property",
          foreignField: "_id",
          as: "propertyDetails",
        },
      },
      { $unwind: { path: "$propertyDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          hostObjectId: {
            $convert: {
              input: "$propertyDetails.host",
              to: "objectId",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "hostObjectId",
          foreignField: "_id",
          as: "hostDetails",
        },
      },
      { $unwind: { path: "$hostDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          checkIn: 1,
          checkOut: 1,
          guests: 1,
          totalPrice: 1,
          status: 1,
          paymentStatus: 1,
          createdAt: 1,
          "guestDetails.name": 1,
          "guestDetails.email": 1,
          "propertyDetails.title": 1,
          "propertyDetails.city": 1,
          "hostDetails.name": 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]).toArray();

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}