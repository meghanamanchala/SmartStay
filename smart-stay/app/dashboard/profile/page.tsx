// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const role = (session.user as any).role;

  if (role === "admin") {
    redirect("/dashboard/profile/admin");
  }

  if (role === "host") {
    redirect("/dashboard/profile/host");
  }

  if (role === "guest") {
    redirect("/dashboard/profile/guest");
  }

  redirect("/auth/login");
}
