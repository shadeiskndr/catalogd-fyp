import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Roboto_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ColorThemeProvider } from "@/lib/color-provider";
import { ConvexAuthProvider } from "@/lib/convex-auth-provider";
import { ConvexClientProvider } from "@/lib/convex-client-provider";
import { MotionProvider } from "@/lib/motion-provider";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "@/lib/theme-provider";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta-sans",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "Catalogd",
  description: "Your favorite games, all in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakartaSans.variable} ${robotoMono.variable}`}
    >
      <body>
        <Suspense>
          <ConvexAuthProvider>
            <ConvexClientProvider>
              <ThemeProvider>
                <ColorThemeProvider>
                  <MotionProvider>
                    <QueryProvider>{children}</QueryProvider>
                  </MotionProvider>
                  <Toaster />
                </ColorThemeProvider>
              </ThemeProvider>
            </ConvexClientProvider>
          </ConvexAuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
