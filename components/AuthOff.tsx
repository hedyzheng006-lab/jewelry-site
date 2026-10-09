// Shown on the account pages when the Clerk keys have not been added yet.
export default function AuthOff() {
  return (
    <div className="page narrow">
      <h1>Accounts are not set up yet</h1>
      <p>Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to the environment to turn on sign up and log in.</p>
    </div>
  );
}
