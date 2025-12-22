import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ColorThemeProvider } from "@/lib/color-provider";
import { ConvexClientProvider } from "@/lib/convex-client-provider";
import { MotionProvider } from "@/lib/motion-provider";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "@/lib/theme-provider";

export const metadata: Metadata = {
  title: "Catalogd",
  description: "Your favorite games, all in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
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
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
