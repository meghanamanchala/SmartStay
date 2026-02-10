import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const email = session.user.email;
  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection("users").findOne({ email });
  if (!user || user.role !== "host") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch properties for this host (ObjectId match)
  const properties = await db.collection("properties").find({ host: user._id }).toArray();
  const propertyIds = properties.map((p: any) => p._id.toString());

  // Fetch bookings for this host's properties
  const objectPropertyIds = propertyIds.map(id => new ObjectId(id));
  const bookings = await db.collection("bookings").find({
    property: { $in: objectPropertyIds }
  }).toArray();

  // Calculate earnings summary
  const totalEarnings = bookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
  const thisMonth = bookings.filter((b: any) => {
    const checkIn = new Date(b.checkIn);
    const now = new Date();
    return checkIn.getMonth() === now.getMonth() && checkIn.getFullYear() === now.getFullYear();
  }).reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
  const pending = bookings.filter((b: any) => b.status === "pending").reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
  const avgBooking = bookings.length > 0 ? totalEarnings / bookings.length : 0;

  // Calculate percentage changes (dummy values for now)
  const totalEarningsChange = 12;
  const thisMonthChange = 8;
  const pendingChange = -5;
  const avgBookingChange = 15;

  // Chart data: monthly earnings
  const monthlyEarnings: { month: string; amount: number }[] = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let i = 0; i < 12; i++) {
    const now = new Date();
    const month = months[i];
    const year = now.getFullYear();
    const amount = bookings.filter((b: any) => {
      const checkIn = new Date(b.checkIn);
      return checkIn.getMonth() === i && checkIn.getFullYear() === year;
    }).reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
    monthlyEarnings.push({ month, amount });
  }

  // Recent transactions (fetch guest name from users collection)
  const guestIds = bookings.slice(-4).map((b: any) => b.guest).filter(Boolean);
  const guestUsers = guestIds.length > 0
    ? await db.collection("users").find({ _id: { $in: guestIds } }).toArray()
    : [];
  const transactions = bookings.slice(-4).reverse().map((b: any) => {
    const propertyObj = properties.find((p: any) =>
      p._id instanceof ObjectId && b.property instanceof ObjectId
        ? p._id.equals(b.property)
        : p._id.toString() === b.property.toString()
    );
    const guestObj = guestUsers.find((u: any) =>
      u._id instanceof ObjectId && b.guest instanceof ObjectId
        ? u._id.equals(b.guest)
        : u._id.toString() === b.guest.toString()
    );
    return {
      guest: guestObj?.name || b.guestName || "Guest",
      property: propertyObj?.title || "",
      date: b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "",
      amount: b.totalPrice || 0,
      status: b.status || "completed",
    };
  });

  return NextResponse.json({
    totalEarnings,
    totalEarningsChange,
    thisMonth,
    thisMonthChange,
    pending,
    pendingChange,
    avgBooking,
    avgBookingChange,
    monthlyEarnings,
    transactions,
  });
}
