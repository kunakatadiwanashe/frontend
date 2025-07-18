// import NextAuth, { NextAuthOptions } from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import { compare } from "bcrypt";
// import { connectToDB } from "@/app/lib/db"; 
// import User from "@/app/models/user";      

// export const authOptions: NextAuthOptions = {
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials) return null;

//         const { email, password } = credentials;

//         await connectToDB();

//         const user = await User.findOne({ email });
//         if (!user) return null;

//         const isValid = await compare(password, user.password);
//         if (!isValid) return null;

//         return {
//           id: user._id.toString(),
//           name: user.name,
//           email: user.email,
//         };
//       },
//     }),
//   ],
//   pages: {
//     signIn: "/signin",
//   },
//   secret: process.env.NEXTAUTH_SECRET,
//   session: {
//     strategy: "jwt",
//   },
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.user = user;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       session.user = token.user as any;
//       return session;
//     },
//   },
// };

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };



import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth"; 

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };