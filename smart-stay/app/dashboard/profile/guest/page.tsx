import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

type Session = {
  user: SessionUser;
};

export default async function GuestProfilePage() {
  const session = await getServerSession(authOptions) as Session | null;
  if (!session || !session.user || session.user.role !== "guest") {
    redirect("/auth/login");
  }
  const { user } = session;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Guest Profile</h1>
      <div className="bg-white rounded shadow p-6 max-w-md">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
      </div>
    </main>
  );
}
