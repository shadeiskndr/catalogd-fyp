"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounceCallback } from "@/hooks/use-debounce-callback";
import { useGameSearch } from "@/hooks/use-games";
import { catalogImage } from "@/lib/catalog-image";
import { formatReleaseYear } from "@/lib/format";
import type { CatalogGame } from "@/lib/game-types";
import type { NavItem } from "@/lib/nav-items";

const MIN_QUERY_LENGTH = 3;
const PLACEHOLDER_IMAGE = "/imgs/img-placeholder.jpg";
const SKELETON_ROWS = 5;

function SearchSkeleton() {
  const rows = Array.from({ length: SKELETON_ROWS }, (_, index) => `search-row-${index}`);

  return (
    <div className="space-y-1 p-2" aria-live="polite" aria-busy="true">
      <span className="sr-only">Searching the game catalogue</span>
      {rows.map((row) => (
        <div key={row} className="flex items-center gap-2 px-2 py-2">
          <Skeleton className="size-9 shrink-0 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/2 rounded-full" />
            <Skeleton className="h-2.5 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GameCommandItem({
  game,
  onSelect,
}: {
  game: CatalogGame;
  onSelect: (game: CatalogGame) => void;
}) {
  const handleSelect = useCallback(() => {
    onSelect(game);
  }, [game, onSelect]);

  return (
    <CommandItem className="gap-2 py-2" value={game.slug} onSelect={handleSelect}>
      <Image
        src={catalogImage(game.backgroundImage || PLACEHOLDER_IMAGE)}
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 rounded object-cover"
      />
      <div className="flex min-w-0 flex-col">
        <span className="truncate">{game.name}</span>
        {game.released ? (
          <span className="text-muted-foreground text-xs tabular-nums">
            {formatReleaseYear(game.released)}
          </span>
        ) : null}
      </div>
    </CommandItem>
  );
}

function NavCommandItem({ item, onSelect }: { item: NavItem; onSelect: (item: NavItem) => void }) {
  const handleSelect = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  return (
    <CommandItem className="gap-2 py-2" value={item.title} onSelect={handleSelect}>
      <item.icon className="size-4 text-muted-foreground" />
      <span>{item.title}</span>
    </CommandItem>
  );
}

type GameSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGame: (game: CatalogGame) => void;
  onSelectNavItem?: (item: NavItem) => void;
  navItems?: readonly NavItem[];
  placeholder?: string;
};

export function GameSearchDialog({
  open,
  onOpenChange,
  onSelectGame,
  onSelectNavItem,
  navItems,
  placeholder = "Search games...",
}: GameSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");

  const debouncedSetQuery = useDebounceCallback(setQuery, 400);

  const { games, isLoading } = useGameSearch(query);
  const isSearching = query.length >= MIN_QUERY_LENGTH;
  const isTyping = searchTerm.length >= MIN_QUERY_LENGTH && searchTerm !== query;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setSearchTerm("");
        setQuery("");
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  const handleInput = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      setSearchTerm(value);
      debouncedSetQuery(value);
    },
    [debouncedSetQuery]
  );

  const handleSelectGame = useCallback(
    (game: CatalogGame) => {
      handleOpenChange(false);
      onSelectGame(game);
    },
    [handleOpenChange, onSelectGame]
  );

  const handleSelectNavItem = useCallback(
    (item: NavItem) => {
      handleOpenChange(false);
      onSelectNavItem?.(item);
    },
    [handleOpenChange, onSelectNavItem]
  );

  const isPending = isTyping || (isSearching && isLoading);

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} shouldFilter={false}>
      <CommandInput placeholder={placeholder} value={searchTerm} onInput={handleInput} />
      <CommandList className="max-h-[min(28rem,60vh)]">
        {isPending ? <SearchSkeleton /> : null}

        {isPending ? null : (
          <CommandEmpty>
            {isSearching ? (
              <span className="text-muted-foreground text-sm">No games match “{query}”.</span>
            ) : (
              <span className="flex flex-col items-center gap-1 text-muted-foreground text-sm">
                <Search className="size-4" />
                <span>Type at least {MIN_QUERY_LENGTH} characters to search games.</span>
              </span>
            )}
          </CommandEmpty>
        )}

        {navItems !== undefined && navItems.length > 0 && !isSearching ? (
          <CommandGroup heading="Navigation">
            {navItems.map((item) => (
              <NavCommandItem key={item.url} item={item} onSelect={handleSelectNavItem} />
            ))}
          </CommandGroup>
        ) : null}

        {isSearching && !isPending && games.length > 0 ? (
          <CommandGroup heading="Games">
            {games.map((game) => (
              <GameCommandItem key={game.rawgId} game={game} onSelect={handleSelectGame} />
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
      <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-muted-foreground text-xs">
        <span className="flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          <span>to navigate</span>
        </span>
        <span className="flex items-center gap-1">
          <Kbd>Esc</Kbd>
          <span>to close</span>
        </span>
      </div>
    </CommandDialog>
  );
}
