import { auth } from "@clerk/nextjs/server";

// Sign up and log in use Clerk (free tier). Until both keys are set, the site runs
// exactly as before with no account features, so a missing key never breaks a deploy.
export const authEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

// The signed-in user's Clerk id, or null when signed out or when accounts are not set up.
export async function currentUserId(): Promise<string | null> {
  if (!authEnabled) return null;
  return (await auth()).userId;
}
