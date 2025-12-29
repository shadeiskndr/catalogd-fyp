import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { RouteTransition } from "@/components/layout/route-transition";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SidebarProvider className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          <div className="scrollbar-gutter-stable flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-12 md:px-6">
              <RouteTransition>{children}</RouteTransition>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
