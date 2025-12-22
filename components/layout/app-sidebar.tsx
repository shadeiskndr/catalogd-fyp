"use client";

import { Heart } from "lucide-react";
import { NavHeader } from "@/components/layout/nav-header";
import { NavMain } from "@/components/layout/nav-main";
import { SocialLinks } from "@/components/layout/social-links";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar-context";
import { NAV_ITEMS } from "@/lib/nav-items";

function AppSidebarFooter({ isCollapsed }: { isCollapsed: boolean }) {
  if (isCollapsed) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="w-full" aria-label="About">
            <Heart />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto">
          <SocialLinks />
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <div className="border-t px-2 py-6">
      <SocialLinks />
    </div>
  );
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" {...props}>
      <NavHeader isCollapsed={isCollapsed} />
      <SidebarContent>
        <NavMain items={NAV_ITEMS} />
      </SidebarContent>
      <SidebarFooter>
        <AppSidebarFooter isCollapsed={isCollapsed} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
