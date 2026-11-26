import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";

async function HomeSignIn() {
  const { userId } = await auth();
  if (userId) redirect("/manage/dash/stat");

  return <SignIn routing="hash" signUpUrl="/sign-up" fallbackRedirectUrl="/manage/dash/stat" />;
}

export default function Home() {
  return (
    <AuthShell>
      <Suspense
        fallback={<div className="h-[420px] w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-[#2C3036]" />}
      >
        <HomeSignIn />
      </Suspense>
    </AuthShell>
  );
}
