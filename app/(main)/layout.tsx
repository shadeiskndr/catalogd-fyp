import "@/app/globals.css"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppTopbar } from "@/components/layout/app-topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// Unauthenticated users are redirected to "/" by the middleware,
// so this layout can render the app shell unconditionally.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
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
  )
}
