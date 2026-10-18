import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authenticateUser, getUserWithPermissions } from '@/lib/auth';
import { initDatabase } from '@/lib/db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await initDatabase();
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const user = authenticateUser(credentials.identifier, credentials.password);
        if (!user) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          phone: user.phone,
          userType: user.user_type,
          roleName: user.role_name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
        token.roleName = user.roleName;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.userType = token.userType;
        session.user.roleName = token.roleName;
        session.user.phone = token.phone;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'priyo-collection-secret-key-change-in-production-2026',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
