// NextAuth.js configuration for role-based authentication
import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Record<"email" | "password", string> | undefined,
        req: any
      ) {
        // Connect to MongoDB
        const client = await clientPromise;
        const db = client.db();
        // Find user by email
        const user = await db.collection("users").findOne({ email: credentials?.email });
        if (user && user.password === credentials?.password) {
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user }: { user: any }) {
      try {
        // Notify all admins when a user logs in
        const client = await clientPromise;
        const db = client.db();
        
        // Get all admin users
        const admins = await db.collection("users").find({ role: "admin" }).toArray();
        
        // Create notification for each admin
        const notifications = admins.map((admin) => ({
          type: "info",
          recipientEmail: admin.email,
          recipientRole: "admin",
          title: "User Login",
          message: `${user.name || user.email} (${user.role || "guest"}) has logged in`,
          metadata: {
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            userRole: user.role,
            loginTime: new Date(),
          },
          read: false,
          createdAt: new Date(),
        }));
        
        if (notifications.length > 0) {
          await db.collection("notifications").insertMany(notifications);
        }
      } catch (error) {
        console.error("Failed to create login notification:", error);
        // Don't block login if notification fails
      }
      
      return true;
    },
    async session({ session, token }: { session: Session; token: any }) {
      if (token?.role) (session.user as any).role = token.role;
      if (token?.id) (session.user as any).id = token.id;
      return session;
    },
    async jwt({ token, user }: { token: any; user?: User }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
