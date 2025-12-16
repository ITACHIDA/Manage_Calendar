import NextAuth, { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

const refreshAccessToken = async (token: any) => {
  try {
    const params = new URLSearchParams({
      client_id: process.env.MS_CLIENT_ID ?? '',
      client_secret: process.env.MS_CLIENT_SECRET ?? '',
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
      scope: 'offline_access Calendars.Read User.Read',
    });

    const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const refreshed = await res.json();
    if (!res.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing token', error);
    return { ...token, error: 'RefreshAccessTokenError' as const };
  }
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  providers: [
    AzureADProvider({
      clientId: process.env.MS_CLIENT_ID ?? '',
      clientSecret: process.env.MS_CLIENT_SECRET ?? '',
      tenantId: process.env.MS_TENANT_ID ?? 'common',
      authorization: {
        params: {
          scope: 'openid profile email offline_access Calendars.Read User.Read',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 60 * 60 * 1000,
        };
      }
      const expiresAt =
        typeof (token as any).accessTokenExpires === 'number' ? (token as any).accessTokenExpires : undefined;
      if (expiresAt && Date.now() < expiresAt) return token;
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      (session as any).error = token.error;
      return session;
    },
  },
};

export const { handlers, auth } = NextAuth(authOptions);
