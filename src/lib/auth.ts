import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        await connectToDatabase();

        // 🔍 1. Recherche insensible à la casse pour intercepter les majuscules de la base Cloud Atlas
        const user = await User.findOne({
          email: { $regex: new RegExp(`^${email}$`, "i") }
        });

        if (!user) return null;

        // 🔒 2. Validation de sécurité sur le champ d'origine réaligné 'password'
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // 💡 3. Renvoi des propriétés pour la session client
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name, // Récupère le champ 'name' d'origine de MongoDB Cloud
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
