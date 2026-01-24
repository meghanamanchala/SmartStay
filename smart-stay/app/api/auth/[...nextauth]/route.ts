// NextAuth.js configuration for role-based authentication
import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";


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
        // Replace with your user lookup logic (DB, etc.)
        // Example user data for demo
        const users = [
          { id: "1", name: "Host User", email: "host@example.com", password: "host123", role: "host" },
          { id: "2", name: "Guest User", email: "guest@example.com", password: "guest123", role: "guest" },
          { id: "3", name: "Admin User", email: "admin@example.com", password: "admin123", role: "admin" },
        ];
        const user = users.find(
          (u) => u.email === credentials?.email && u.password === credentials?.password
        );
        if (user) {
          return { id: user.id, name: user.name, email: user.email, role: user.role };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: Session; token: any }) {
      if (token?.role) (session.user as any).role = token.role;
      return session;
    },
    async jwt({ token, user }: { token: any; user?: User }) {
      if (user) token.role = (user as any).role;
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
