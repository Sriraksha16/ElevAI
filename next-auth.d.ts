import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      careerTitle?: string | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    careerTitle?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    careerTitle?: string;
  }
}