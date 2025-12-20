import "./globals.css"
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server"
import { Toaster } from "react-hot-toast"
import { ColorThemeProvider } from "@/lib/color-provider"
import { ConvexClientProvider } from "@/lib/convex-client-provider"
import { QueryProvider } from "@/lib/query-provider"
import { Providers } from "@/lib/theme-provider"

export const metadata = {
  title: "Catalogd",
  description: "Your favorite games, all in one place.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ConvexClientProvider>
            <Providers>
              <ColorThemeProvider>
                <QueryProvider>{children}</QueryProvider>
              </ColorThemeProvider>
            </Providers>
          </ConvexClientProvider>
          <Toaster />
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  )
}
