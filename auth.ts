import Google from "next-auth/providers/google";
import NextAuth from "next-auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? process.env.GoogleClientID;
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET ?? process.env.GoogleClientSecret;

if (!googleClientId || !googleClientSecret) {
  throw new Error(
    "Missing Google OAuth env vars. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        if (!user?.email) {
          return false;
        }

        await connectToDatabase();
        const existingUser = await User.findOne({ email: user.email });
        const resolvedName = user.name?.trim() || user.email.split("@")[0];

        if (!existingUser) {
          const newUser = new User({
            email: user.email,
            name: resolvedName,
            image: user.image ?? undefined,
          });
          await newUser.save();
        } else {
          const nextName = user.name?.trim();
          const nextImage = user.image ?? undefined;

          if (
            (nextName && existingUser.name !== nextName) ||
            existingUser.image !== nextImage
          ) {
            existingUser.name = nextName || existingUser.name;
            existingUser.image = nextImage;
            await existingUser.save();
          }
        }

        return true;
      } catch (error) {
        console.error("Error during sign-in callback:", error);
        return false;
      }
    },
  },
});
