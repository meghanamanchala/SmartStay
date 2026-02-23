import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const db = client.db();

  const usersCount = await db.collection("users").countDocuments();
  const propertiesCount = await db.collection("properties").countDocuments();
  const bookingsCount = await db.collection("bookings").countDocuments();

  return NextResponse.json({
    users: usersCount,
    properties: propertiesCount,
    bookings: bookingsCount,
  });
}
