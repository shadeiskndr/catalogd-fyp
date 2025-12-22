import {
  BookOpenText,
  Bot,
  Flame,
  Folder,
  Gamepad2,
  Gift,
  Home,
  type LucideIcon,
  MessageCircle,
  Pencil,
  Sparkles,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "My Library", url: "/library", icon: Folder },
  { title: "Wishlist", url: "/wishlist", icon: Gift },
  { title: "New Releases", url: "/new-releases", icon: Sparkles },
  { title: "Most Popular", url: "/popular", icon: Flame },
  { title: "Genres", url: "/genres", icon: Gamepad2 },
  { title: "Write Review", url: "/write-review", icon: Pencil },
  { title: "Reviews", url: "/reviews", icon: BookOpenText },
  { title: "AI Recommender", url: "/ai-rec", icon: Bot },
  { title: "Chat Room", url: "/chat", icon: MessageCircle },
];
