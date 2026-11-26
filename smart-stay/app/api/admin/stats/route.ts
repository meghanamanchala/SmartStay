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

    const currentUser = await db.collection("users").findOne({ email: session.user.email });
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [usersCount, propertiesCount, bookingsCount] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("properties").countDocuments(),
      db.collection("bookings").countDocuments(),
    ]);

    return NextResponse.json({
      users: usersCount,
      properties: propertiesCount,
      bookings: bookingsCount,
    });
  } catch (error) {
    console.error("GET /api/admin/stats failed:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
