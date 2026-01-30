import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string
    user: {
      id: string
      handle?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    handle?: string
  }

  interface Profile {
    data?: {
      id: string
      name: string
      profile_image_url: string
      username: string
    }
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    accessToken?: string
    refreshToken?: string
    handle?: string
    id?: string
  }
}