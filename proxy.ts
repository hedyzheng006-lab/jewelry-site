import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { authEnabled } from "@/lib/auth";

// Pages that need an account. Signed-out visitors are sent to /sign-in first.
const isPrivate = createRouteMatcher(["/orders(.*)"]);

export default authEnabled
  ? clerkMiddleware(async (auth, req) => {
      if (isPrivate(req)) await auth.protect();
    }, { signInUrl: "/sign-in", signUpUrl: "/sign-up" })
  : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
