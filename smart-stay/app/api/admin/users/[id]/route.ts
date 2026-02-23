import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId, type Db } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type UpdatableRole = "guest" | "host";
type UpdatableStatus = "active" | "suspended";

type AuthorizedAdminContext =
  | { error: NextResponse }
  | { db: Db; sessionUserEmail: string };

const isValidRole = (value: unknown): value is UpdatableRole => value === "guest" || value === "host";
const isValidStatus = (value: unknown): value is UpdatableStatus => value === "active" || value === "suspended";

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

  return { db, sessionUserEmail: session.user.email };
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
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const body = (await req.json()) as { role?: unknown; status?: unknown };
    const updates: { role?: UpdatableRole; status?: UpdatableStatus } = {};

    if (body.role !== undefined) {
      if (!isValidRole(body.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updates.role = body.role;
    }

    if (body.status !== undefined) {
      if (!isValidStatus(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (!updates.role && !updates.status) {
      return NextResponse.json({ error: "No valid update fields provided" }, { status: 400 });
    }

    const targetUser = await adminContext.db.collection("users").findOne({ _id: new ObjectId(id) });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.email === adminContext.sessionUserEmail) {
      return NextResponse.json({ error: "You cannot update your own account from this panel" }, { status: 400 });
    }

    if (targetUser.role === "admin") {
      return NextResponse.json({ error: "Admin users cannot be modified" }, { status: 400 });
    }

    await adminContext.db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );

    const updatedUser = await adminContext.db.collection("users").findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
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
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const targetUser = await adminContext.db.collection("users").findOne({ _id: new ObjectId(id) });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.email === adminContext.sessionUserEmail) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    if (targetUser.role === "admin") {
      return NextResponse.json({ error: "Admin users cannot be deleted" }, { status: 400 });
    }

    await adminContext.db.collection("users").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
