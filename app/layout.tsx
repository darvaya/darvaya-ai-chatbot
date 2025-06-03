import { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { PostHogProvider } from "posthog-js/react";
import { env } from "@/lib/env";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import Script from "next/script";

import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DarvayaAI - Advanced AI-powered Chatbot",
  description:
    "Intelligent conversational experiences and deep insights for businesses.",
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
              <>
                <Script
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
                  strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                  {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
                  `}
                </Script>
              </>
            )}
            {env.NEXT_PUBLIC_POSTHOG_KEY ? (
              <PostHogProvider
                apiKey={env.NEXT_PUBLIC_POSTHOG_KEY}
                options={{
                  api_host:
                    env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
                  capture_pageview: true,
                  persistence: "localStorage",
                  autocapture: true,
                  loaded: (posthog) => {
                    if (process.env.NODE_ENV === "development") posthog.debug();
                  },
                }}
              >
                {children}
                <Toaster />
              </PostHogProvider>
            ) : (
              <>
                {children}
                <Toaster />
              </>
            )}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
