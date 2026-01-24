import { getServerSession } from "next-auth";
// Update the import path below to the correct location of your authOptions export
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

type AdminUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

type AdminSession = {
  user: AdminUser;
  [key: string]: any;
};

export default async function AdminProfilePage() {
  const session = await getServerSession(authOptions) as AdminSession;
  if (!session || !session.user || session.user.role !== "admin") {
    redirect("/auth/login");
  }
  const { user } = session;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Profile</h1>
      <div className="bg-white rounded shadow p-6 max-w-md">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        {/* Add admin-specific profile management here */}
      </div>
    </main>
  );
}
