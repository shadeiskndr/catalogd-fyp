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
import Link from "next/link"
import type * as React from "react"
import { BsGithub, BsLinkedin, BsTwitter } from "react-icons/bs"
import { IoGameController } from "react-icons/io5"
import { NavMain } from "@/components/layout/nav-main"
import { TeamSwitcher } from "@/components/layout/team-switcher"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

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
        <div className="space-y-4 border-t px-4 py-6">
          <div className="text-center space-y-2">
            <div className="text-indigo-500 text-xs flex flex-col items-center">
              <h2>Built with</h2>
              <span>
                <HeartIcon className="w-2 h-2 text-red-500" />
              </span>
              <h2>by Shahathir Iskandar</h2>
            </div>
            <div className="flex justify-center space-x-4">
              <ThemeToggle />
              <Link
                href="https://github.com/shadeiskndr"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BsGithub className="w-5 h-5 text-gray-600 hover:text-gray-100 transition duration-300 hover:scale-105" />
              </Link>
              <Link
                href="https://twitter.com/shadeiskndr"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BsTwitter className="w-5 h-5 text-gray-600 hover:text-cyan-500 transition duration-300 hover:scale-105" />
              </Link>
              <Link
                href="https://www.linkedin.com/in/shahathir-iskandar-b60869270/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BsLinkedin className="w-5 h-5 text-gray-600 hover:text-blue-500 transition duration-300 hover:scale-105" />
              </Link>
            </div>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
