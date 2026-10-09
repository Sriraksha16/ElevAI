
import { withAuth } from "next-auth/middleware";

const authMiddleware = withAuth({
  pages: {
    signIn: "/signin",
  },
});

export default function proxy(...args: Parameters<typeof authMiddleware>) {
  return authMiddleware(...args);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
