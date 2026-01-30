import { NextAuthOptions } from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"

// Authentication configuration
export const authConfig: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      version: "2.0", // opt-in to Twitter OAuth 2.0
      authorization: {
        params: {
          scope: "users.read tweet.read like.read follows.read offline.access",
        },
      },
      profile(profile) {
        return {
          id: profile.data.id,
          name: profile.data.name,
          email: null,
          image: profile.data.profile_image_url,
          // Custom field to pass handle
          handle: profile.data.username,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      if (user) {
        token.handle = user.handle;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.handle = token.handle;
        session.user.id = token.id as string;
        // Make token available for server-side API calls
        session.accessToken = token.accessToken;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
