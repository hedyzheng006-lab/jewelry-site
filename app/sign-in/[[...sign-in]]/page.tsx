import { SignIn } from "@clerk/nextjs";
import AuthOff from "@/components/AuthOff";
import { authEnabled } from "@/lib/auth";

export const metadata = { title: "Log in" };

export default function SignInPage() {
  if (!authEnabled) return <AuthOff />;
  return (
    <div className="page auth-page">
      <SignIn />
    </div>
  );
}
