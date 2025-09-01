import type { NextAuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"

export const microsoftProvider = {
  id: "microsoft",
  name: "Microsoft",
  type: "oauth" as const,
  authorization: {
    url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    params: {
      scope: "openid email profile User.Read",
      response_type: "code",
    },
  },
  token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  userinfo: "https://graph.microsoft.com/v1.0/me",
  clientId: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  profile(profile: any) {
    return {
      id: profile.id,
      name: profile.displayName,
      email: profile.mail || profile.userPrincipalName,
      image: null,
      microsoftId: profile.id,
    }
  },
}

export const nextAuthConfig: NextAuthOptions = {
  providers: [microsoftProvider],
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user?: any; account?: any }) {
      if (account && user) {
        token.microsoftId = user.microsoftId
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }: { session: any; token: JWT }) {
      session.user.microsoftId = token.microsoftId
      session.accessToken = token.accessToken
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}
