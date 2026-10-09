import { SignUp } from "@clerk/nextjs";
import AuthOff from "@/components/AuthOff";
import { authEnabled } from "@/lib/auth";

export const metadata = { title: "Sign up" };

export default function SignUpPage() {
  if (!authEnabled) return <AuthOff />;
  return (
    <div className="page auth-page">
      <SignUp />
    </div>
  );
}
