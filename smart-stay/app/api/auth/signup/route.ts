import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { notifyAdminsNewUser } from "@/lib/notificationHelpers";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password, role, profileImageUrl, phone, location, bio } = body;

  // Connect to MongoDB
  const clientPromise = await import("@/lib/mongodb");
  const client = await clientPromise.default;
  const db = client.db();

  // Check if user already exists
  const existing = await db.collection("users").findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  // Insert new user
  const result = await db.collection("users").insertOne({
    name,
    email,
    password, // In production, hash the password!
    role,
    profileImageUrl: profileImageUrl || '',
    phone: phone || '',
    location: location || '',
    bio: bio || '',
    createdAt: new Date(),
  });

  // Notify admins about new user registration
  try {
    await notifyAdminsNewUser({
      name,
      email,
      role: role || 'guest',
      userId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error('Failed to notify admins about new user:', error);
    // Don't block signup if notification fails
  }

  return NextResponse.json({
    id: result.insertedId,
    name,
    email,
    role,
    profileImageUrl: profileImageUrl || '',
    phone: phone || '',
    location: location || '',
    bio: bio || '',
  }, { status: 201 });
}
