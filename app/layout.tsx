import "./globals.css"
import { Toaster } from "react-hot-toast"
import { Providers } from "@/lib/theme-provider"
import { ColorThemeProvider } from "@/lib/color-provider"

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <ColorThemeProvider>{children}</ColorThemeProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
