import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
  // Fetch properties for this host
  const properties = await db.collection("properties").find({ host: user._id.toString() }).toArray();

  // Fetch bookings for this host's properties
  const propertyIds = properties.map((p: any) => p._id.toString());
  const bookings = await db.collection("bookings").find({ property: { $in: propertyIds } }).toArray();

  // Calculate stats
  const activeListings = properties.length;
  const totalEarnings = bookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
  const upcomingBookings = bookings.filter((b: any) => new Date(b.checkIn) > new Date()).length;
  const averageRating = properties.length > 0 ? (
    properties.reduce((sum: number, p: any) => sum + (p.rating || 0), 0) / properties.length
  ) : 0;

  // Format stats for UI
  const stats = [
    { icon: "home", label: "Active Listings", value: activeListings, change: "+0" },
    { icon: "dollar", label: "Total Earnings", value: `$${totalEarnings}`, change: "+0%" },
    { icon: "calendar", label: "Upcoming Bookings", value: upcomingBookings, change: "+0" },
    { icon: "star", label: "Average Rating", value: averageRating.toFixed(1), change: "+0" },
  ];

  // Format bookings for UI (show last 3)
  const bookingsUI = bookings.slice(-3).reverse().map((b: any) => ({
    property: properties.find((p: any) => p._id.toString() === b.property)?.title || "",
    location: properties.find((p: any) => p._id.toString() === b.property)?.city || "",
    guest: b.guestName || "Guest",
    checkin: b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "",
    checkout: b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "",
    total: b.totalPrice ? `$${b.totalPrice}` : "",
    status: b.status || "Confirmed",
  }));

  // Format properties for UI (show last 3)
  const propertiesUI = properties.slice(-3).reverse().map((p: any) => ({
    name: p.title,
    location: `${p.city}, ${p.country}`,
    price: p.price ? `$${p.price}/night` : "",
    rating: p.rating || 0,
    image: p.images && p.images.length > 0 ? p.images[0] : "",
  }));

  return NextResponse.json({
    stats,
    bookings: bookingsUI,
    properties: propertiesUI,
    host: { name: user.name, email: user.email },
  });
}
