import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId, type Db } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type BookingStatus = "pending" | "confirmed" | "checked-in" | "completed" | "cancelled";

type AuthorizedAdminContext =
  | { error: NextResponse }
  | { db: Db };

const isValidStatus = (value: unknown): value is BookingStatus =>
  value === "pending" ||
  value === "confirmed" ||
  value === "checked-in" ||
  value === "completed" ||
  value === "cancelled";

const canTransition = (fromStatus: string, toStatus: BookingStatus) => {
  const from = (fromStatus || "pending").toLowerCase();

  return (
    (from === "pending" && (toStatus === "confirmed" || toStatus === "cancelled")) ||
    (from === "confirmed" && (toStatus === "checked-in" || toStatus === "cancelled")) ||
    (from === "checked-in" && toStatus === "completed")
  );
};

async function getAuthorizedAdmin(): Promise<AuthorizedAdminContext> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const client = await clientPromise;
  const db = client.db();

  const currentUser = await db.collection("users").findOne({ email: session.user.email });
  if (!currentUser || currentUser.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { db };
}

const hasAuthError = (context: AuthorizedAdminContext): context is { error: NextResponse } => "error" in context;

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const adminContext = await getAuthorizedAdmin();
    if (hasAuthError(adminContext)) {
      return adminContext.error;
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
    }

    const body = (await req.json()) as { status?: unknown };
    if (!isValidStatus(body.status)) {
      return NextResponse.json({ error: "Invalid booking status" }, { status: 400 });
    }

    const booking = await adminContext.db.collection("bookings").findOne({ _id: new ObjectId(id) });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!canTransition(booking.status || "pending", body.status)) {
      return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
    }

    await adminContext.db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: body.status,
          updatedAt: new Date(),
        },
      }
    );

    const updatedBooking = await adminContext.db.collection("bookings").findOne({ _id: new ObjectId(id) });

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
