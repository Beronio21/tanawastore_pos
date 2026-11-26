import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";

export default function SignUpPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={<div className="h-[420px] w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-[#2C3036]" />}
      >
        <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/onboarding" />
      </Suspense>
    </AuthShell>
  );
}
