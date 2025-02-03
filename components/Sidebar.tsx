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
import { BsGithub, BsLinkedin, BsTwitter } from "react-icons/bs"
import { IoGameController } from "react-icons/io5"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: HomeIcon },
  { name: "My Library", path: "/MyLib", icon: FolderIcon },
  { name: "Wishlist", path: "/Wish", icon: GiftIcon },
  { name: "New Releases", path: "/New", icon: SparklesIcon },
  { name: "Most Popular", path: "/Pop", icon: FireIcon },
  { name: "Genres", path: "/genres", icon: IoGameController },
  { name: "Write Review", path: "/Write", icon: PencilIcon },
  { name: "Reviews", path: "/Review", icon: BookOpenIcon },
  { name: "AI Recommender", path: "/AIRec", icon: CpuChipIcon },
  { name: "Chat Room", path: "/Chat", icon: ChatBubbleLeftRightIcon },
]

function SidebarHeader_Content() {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <h1 className="text-2xl font-bold text-gray-500">Catalogd</h1>
    </div>
  )
}

function SidebarFooter_Content() {
  return (
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
  )
}

function SidebarContent_Menu() {
  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.path}>
          <SidebarMenuButton asChild>
            <Link href={item.path} className="flex items-center gap-2">
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

export default function SidebarWrapper() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarHeader_Content />
        </SidebarHeader>
        <SidebarContent>
          <SidebarContent_Menu />
        </SidebarContent>
        <SidebarFooter>
          <SidebarFooter_Content />
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}
