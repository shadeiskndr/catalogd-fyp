"use client"

import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  FireIcon,
  FolderIcon,
  GiftIcon,
  HeartIcon,
  HomeIcon,
  PencilIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid"
import type * as React from "react"
import { IoGameController } from "react-icons/io5"
import { NavMain } from "@/components/layout/nav-main"
import { TeamSwitcher } from "@/components/layout/team-switcher"
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
  SidebarHeader,
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
      icon: HomeIcon,
      isActive: true,
    },
    {
      title: "My Library",
      url: "/MyLib",
      icon: FolderIcon,
    },
    {
      title: "Wishlist",
      url: "/Wish",
      icon: GiftIcon,
    },
    {
      title: "New Releases",
      url: "/New",
      icon: SparklesIcon,
    },
    {
      title: "Most Popular",
      url: "/Pop",
      icon: FireIcon,
    },
    {
      title: "Genres",
      url: "/genres",
      icon: IoGameController,
    },
    {
      title: "Write Review",
      url: "/Write",
      icon: PencilIcon,
    },
    {
      title: "Reviews",
      url: "/Review",
      icon: BookOpenIcon,
    },
    {
      title: "AI Recommender",
      url: "/AIRec",
      icon: CpuChipIcon,
    },
    {
      title: "Chat Room",
      url: "/Chat",
      icon: ChatBubbleLeftRightIcon,
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
            <HeartIcon />
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={[
            {
              name: "Catalogd",
              logo: IoGameController,
              plan: "Game Catalog",
            },
          ]}
        />
      </SidebarHeader>
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
