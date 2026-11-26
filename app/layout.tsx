import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TenantProvider } from "./tenant-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TanAwa POS – Management Console & POS Terminal",
  description: "Cloud management console and point of sale for tanawa.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-hidden" suppressHydrationWarning>
        <ClerkProvider>
          <script
          dangerouslySetInnerHTML={{
          __html: `try{var t=localStorage.getItem('tanawa-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t;}catch(e){}`,
          }}
          />
          <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#24272C]" />}>
          <TenantProvider>{children}</TenantProvider>
          </Suspense>
        </ClerkProvider>
      </body>
    </html>
  );
}