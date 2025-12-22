"use client";

import { usePathname } from "next/navigation";
import { ColorThemeToggle } from "@/components/layout/color-theme-toggle";
import { LogoutButton } from "@/components/layout/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { NAV_ITEMS } from "@/lib/nav-items";

export function AppTopbar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();

  const currentPage = NAV_ITEMS.find((item) => pathname.startsWith(item.url))?.title ?? "Dashboard";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-4 px-4">
        {user?.name !== undefined && <span className="mr-2 text-sm">Welcome, {user.name}!</span>}
        <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
        <ColorThemeToggle />
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
