import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "World Albanian Congress",
  description: "The global Albanian diaspora network — connecting people, organizations, and businesses worldwide.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050505",
  interactiveWidget: "resizes-content",
};

import Navbar from "@/components/layout/Navbar";
import { ActorProvider } from "@/components/providers/ActorProvider";
import OnboardingGate from "@/components/onboarding/OnboardingGate";
import FloatingMessagingIcon from "@/components/layout/FloatingMessagingIcon";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import { Analytics } from "@vercel/analytics/react";
import { BetaFeedback } from "@/components/ui/BetaFeedback";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Preload the logo so it's always decoded before the Navbar renders it */}
        <link rel="preload" as="image" href="/images/wac-logo.jpg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased min-h-screen bg-[var(--background)] flex flex-col overflow-x-hidden`}
        suppressHydrationWarning
      >
        <div id="google_translate_element" className="hidden"></div>
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <Script id="google-translate-config" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              try {
                new google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'sq,en',
                  autoDisplay: false
                }, 'google_translate_element');
              } catch(e) {}
            }
          `}
        </Script>

        <ActorProvider>
          <OnboardingGate>
            <div className="flex min-h-screen flex-col overflow-x-hidden">
              <Navbar />
              <main className="flex-1 pb-[72px] md:pb-0">{children}</main>
              <FloatingMessagingIcon />
              <MobileBottomNav />
              <ConditionalFooter />
            </div>
            <BetaFeedback />
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#1A1A1A',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                },
              }}
            />
          </OnboardingGate>
        </ActorProvider>
        <Analytics />
      </body>
    </html>
  );
}
