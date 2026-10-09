import { auth, clerkClient, type User } from "@clerk/nextjs/server";
import type Stripe from "stripe";

// Sign up and log in use Clerk (free tier). Until both keys are set, the site runs
// exactly as before with no account features, so a missing key never breaks a deploy.
export const authEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

// The signed-in user's Clerk id, or null when signed out or when accounts are not set up.
export async function currentUserId(): Promise<string | null> {
  if (!authEnabled) return null;
  return (await auth()).userId;
}

// The Stripe customer for a signed-in shopper, created on their first checkout and kept
// in their Clerk private metadata. Orders are then listed straight from Stripe by customer,
// so a new order shows on /orders right away.
export async function stripeCustomerId(stripe: Stripe, user: User): Promise<string> {
  const saved = user.privateMetadata.stripeCustomerId;
  if (typeof saved === "string" && saved.startsWith("cus_")) return saved;
  const customer = await stripe.customers.create({
    email: user.primaryEmailAddress?.emailAddress,
    name: user.fullName ?? undefined,
    metadata: { userId: user.id },
  });
  await (await clerkClient()).users.updateUserMetadata(user.id, {
    privateMetadata: { stripeCustomerId: customer.id },
  });
  return customer.id;
}
