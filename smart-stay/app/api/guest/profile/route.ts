import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  // Get user email from session (assuming next-auth)
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const email = session.user.email;
  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection("users").findOne({ email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  // Don't send password
  const { password, ...userData } = user;
  return NextResponse.json(userData);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    console.error("Unauthorized: No session or email");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const email = session.user.email;
  const body = await req.json();
  const { name, profileImageUrl, phone, location, bio } = body;
  console.log("[PROFILE PUT] Email:", email);
  console.log("[PROFILE PUT] Body:", { name, profileImageUrl, phone, location, bio });
  const client = await clientPromise;
  const db = client.db();
  const result = await db.collection("users").updateOne(
    { email },
    { $set: { name, profileImageUrl, phone, location, bio } }
  );
  console.log("[PROFILE PUT] Update result:", result);
  if (result.matchedCount === 0) {
    console.error("User not found for email:", email);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
