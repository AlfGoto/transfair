import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    token?: string; // Add custom properties here
    user?: {
      id?: string;
      image?: string;
      name?: string;
      email?: string;
    } & DefaultSession["user"];
  }
}
