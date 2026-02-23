import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId, type Db } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type UpdatablePropertyStatus = "active" | "under-review" | "suspended";

type AuthorizedAdminContext =
  | { error: NextResponse }
  | { db: Db };

const isValidStatus = (value: unknown): value is UpdatablePropertyStatus =>
  value === "active" || value === "under-review" || value === "suspended";

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
    const adminContext: AuthorizedAdminContext = await getAuthorizedAdmin();
    if (hasAuthError(adminContext)) {
      return adminContext.error;
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid property id" }, { status: 400 });
    }

    const body = (await req.json()) as { status?: unknown };
    if (!isValidStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const targetProperty = await adminContext.db
      .collection("properties")
      .findOne({ _id: new ObjectId(id) });

    if (!targetProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    await adminContext.db.collection("properties").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: body.status,
          updatedAt: new Date(),
        },
      }
    );

    const updatedProperty = await adminContext.db.collection("properties").findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({ property: updatedProperty });
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const adminContext: AuthorizedAdminContext = await getAuthorizedAdmin();
    if (hasAuthError(adminContext)) {
      return adminContext.error;
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid property id" }, { status: 400 });
    }

    const targetProperty = await adminContext.db
      .collection("properties")
      .findOne({ _id: new ObjectId(id) });

    if (!targetProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    await adminContext.db.collection("properties").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
  }
}
