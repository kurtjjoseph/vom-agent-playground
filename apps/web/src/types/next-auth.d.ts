import 'next-auth';
import 'next-auth/jwt';

// The auth callbacks in src/lib/auth.ts put the provider's user id onto the
// token and then onto the session, so widen NextAuth's default types to match.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
  }
}
