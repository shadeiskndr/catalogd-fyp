"use client"
import { getSessionData } from "@/utils/appwrite"
import "@/app/globals.css"
// import { SidebarProvider } from "@/utils/SidebarContext";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppTopbar } from "@/components/layout/app-topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)

  //logout fallback
  // biome-ignore lint/correctness/useExhaustiveDependencies: <leave it>
  useEffect(() => {
    getSessionData()
      .then((data) => {
        if (data) {
          setLoggedIn(true)
        } else {
          setLoggedIn(false)
          router.push("/")
        }
      })
      .catch((error) => {
        console.log(error)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {loggedIn && (
        <div className="h-screen flex flex-col overflow-hidden">
          <SidebarProvider className="flex flex-1 min-h-0 overflow-hidden">
            <AppSidebar />
            <SidebarInset className="flex flex-col flex-1">
              <AppTopbar />
              <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-0 overflow-y-auto overflow-x-hidden">
                <div>{children}</div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      )}
    </>
  )
}
