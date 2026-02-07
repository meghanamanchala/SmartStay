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
