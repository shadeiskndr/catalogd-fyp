import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SidebarProvider className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <AppTopbar />
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-4 pt-0">
            <div>{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
