import GoogleProvider from "next-auth/providers/google";
import NextAuth from "next-auth";
import jwt from 'jsonwebtoken';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token; // Add accessToken to JWT
        token.id = user?.id || null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.image = session.user.image.split("=")[0]
      session.token = jwt.sign(session.user, process.env.NEXTAUTH_SECRET, { expiresIn: '12h' });
      // session.token = token;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
