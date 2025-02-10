"use client"

import {
  BookOpenText,
  Bot,
  Flame,
  Folder,
  Gamepad2,
  Gift,
  Heart,
  Home,
  MessageCircle,
  Pencil,
  Sparkles,
} from "lucide-react"
import type * as React from "react"
import { NavHeader } from "@/components/layout/nav-header"
import { NavMain } from "@/components/layout/nav-main"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import SocialSelector from "@/components/ui/smoothui/social-selector"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "My Library",
      url: "/MyLib",
      icon: Folder,
    },
    {
      title: "Wishlist",
      url: "/Wish",
      icon: Gift,
    },
    {
      title: "New Releases",
      url: "/New",
      icon: Sparkles,
    },
    {
      title: "Most Popular",
      url: "/Pop",
      icon: Flame,
    },
    {
      title: "Genres",
      url: "/genres",
      icon: Gamepad2,
    },
    {
      title: "Write Review",
      url: "/Write",
      icon: Pencil,
    },
    {
      title: "Reviews",
      url: "/Review",
      icon: BookOpenText,
    },
    {
      title: "AI Recommender",
      url: "/AIRec",
      icon: Bot,
    },
    {
      title: "Chat Room",
      url: "/Chat",
      icon: MessageCircle,
    },
  ],
}

function AppSidebarFooter() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  if (isCollapsed) {
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="w-full">
            <Heart />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto">
          <div className="flex justify-center items-center gap-2">
            <SocialSelector handle="shadeiskndr" />
          </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  return (
    <div className="space-y-4 border-t px-4 py-6">
      <div className="flex justify-center items-center gap-2">
        <SocialSelector handle="shadeiskndr" />
      </div>
    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" {...props}>
      <NavHeader items={data.navMain} isCollapsed={isCollapsed} />
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <AppSidebarFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
