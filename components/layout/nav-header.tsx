"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { GameSearchDialog } from "@/components/game-search-dialog";
import { NavBrand } from "@/components/layout/nav-brand";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { SidebarHeader } from "@/components/ui/sidebar";
import type { CatalogGame } from "@/lib/game-types";
import { NAV_ITEMS, type NavItem } from "@/lib/nav-items";

export function NavHeader({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const searchId = useId();
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const openSearch = useCallback(() => {
    setOpen(true);
  }, []);

  const handleSelectGame = useCallback(
    (game: CatalogGame) => {
      router.push(`/game/${game.slug}`);
    },
    [router]
  );

  const handleSelectNavItem = useCallback(
    (item: NavItem) => {
      router.push(item.url);
    },
    [router]
  );

  return (
    <>
      <SidebarHeader className="flex flex-col gap-2">
        <NavBrand />
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={openSearch}
            className="size-8 transition-transform duration-150 ease-out active:scale-95"
            aria-label="Search (⌘K)"
          >
            <Search className="size-4" />
          </Button>
        ) : (
          <InputGroup
            onClick={openSearch}
            className="cursor-pointer transition-colors duration-150 ease-out hover:border-ring/50"
          >
            <InputGroupAddon align="inline-start">
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id={searchId}
              name="sidebar-search"
              placeholder="Search"
              readOnly
              className="cursor-pointer"
            />
            <InputGroupAddon align="inline-end">
              <kbd className="inline-flex font-[inherit] font-medium text-muted-foreground text-xs">
                <span className="opacity-70">⌘K</span>
              </kbd>
            </InputGroupAddon>
          </InputGroup>
        )}
      </SidebarHeader>

      <GameSearchDialog
        open={open}
        onOpenChange={setOpen}
        onSelectGame={handleSelectGame}
        onSelectNavItem={handleSelectNavItem}
        navItems={NAV_ITEMS}
        placeholder="Search games and navigation..."
      />
    </>
  );
}
