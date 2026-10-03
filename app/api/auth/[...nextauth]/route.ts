import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import db from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  career_title: string;
};

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.password
        ) {
          return null;
        }

        const email = credentials.email
          .trim()
          .toLowerCase();

        const user = db
          .prepare(`
            SELECT
              id,
              name,
              email,
              password_hash,
              career_title
            FROM users
            WHERE email = ?
          `)
          .get(email) as UserRecord | undefined;

        if (!user) {
          return null;
        }

        const passwordIsValid =
          verifyPassword(
            credentials.password,
            user.password_hash
          );

        if (!passwordIsValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          careerTitle: user.career_title,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  secret: process.env.AUTH_SECRET,

  pages: {
    signIn: "/signin",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;

        token.careerTitle = (
          user as {
            careerTitle?: string;
          }
        ).careerTitle;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          token.id as string;

        session.user.name =
          typeof token.name === "string"
            ? token.name
            : session.user.name;

        session.user.email =
          typeof token.email === "string"
            ? token.email
            : session.user.email;

        session.user.careerTitle =
          typeof token.careerTitle === "string"
            ? token.careerTitle
            : "Career Explorer";
      }

      return session;
    },
  },
});

export { handler as GET, handler as POST };