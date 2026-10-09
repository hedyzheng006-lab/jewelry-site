import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

// Header links for accounts: "Log in / Sign up" when signed out, "My orders" and the
// account menu when signed in.
export default function AuthLinks() {
  return (
    <>
      <Show when="signed-out">
        <Link href="/sign-in">Log in</Link>
        <Link href="/sign-up" className="nav-cta">Sign up</Link>
      </Show>
      <Show when="signed-in">
        <Link href="/orders">My orders</Link>
        <UserButton />
      </Show>
    </>
  );
}
