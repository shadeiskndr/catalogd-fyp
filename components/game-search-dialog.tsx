"use client";

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
import { Spinner } from "@/components/ui/spinner";
import { useDebounceCallback } from "@/hooks/use-debounce-callback";
import { useGameSearch } from "@/hooks/use-games";
import type { Game } from "@/lib/game-types";
import type { NavItem } from "@/lib/nav-items";

const MIN_QUERY_LENGTH = 3;
const PLACEHOLDER_IMAGE = "/imgs/img-placeholder.jpg";

function GameCommandItem({ game, onSelect }: { game: Game; onSelect: (game: Game) => void }) {
  const handleSelect = useCallback(() => {
    onSelect(game);
  }, [game, onSelect]);

  return (
    <CommandItem className="py-2" value={game.slug} onSelect={handleSelect}>
      <Image
        src={game.background_image || PLACEHOLDER_IMAGE}
        alt=""
        width={32}
        height={32}
        className="mr-2 size-8 rounded object-cover"
      />
      <div className="flex flex-col">
        <span>{game.name}</span>
        {game.released ? <span className="text-xs opacity-50">{game.released}</span> : null}
      </div>
    </CommandItem>
  );
}

function NavCommandItem({ item, onSelect }: { item: NavItem; onSelect: (item: NavItem) => void }) {
  const handleSelect = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  return (
    <CommandItem className="py-2" value={item.title} onSelect={handleSelect}>
      <item.icon className="mr-2 size-4" />
      <span>{item.title}</span>
    </CommandItem>
  );
}

type GameSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGame: (game: Game) => void;
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

  const { data, isLoading } = useGameSearch(query);
  const games = data?.results ?? [];
  const isSearching = query.length >= MIN_QUERY_LENGTH;

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
    (game: Game) => {
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

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput placeholder={placeholder} value={searchTerm} onInput={handleInput} />
      <CommandList>
        {isSearching && isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
            <Spinner className="mb-2" />
            <span>Searching...</span>
          </div>
        ) : (
          <CommandEmpty>
            {isSearching
              ? "No results found."
              : `Type at least ${MIN_QUERY_LENGTH} characters to search.`}
          </CommandEmpty>
        )}

        {navItems !== undefined && navItems.length > 0 && (
          <CommandGroup heading="Navigation">
            {navItems.map((item) => (
              <NavCommandItem key={item.url} item={item} onSelect={handleSelectNavItem} />
            ))}
          </CommandGroup>
        )}

        {isSearching && games.length > 0 && (
          <CommandGroup heading="Games">
            {games.map((game) => (
              <GameCommandItem key={game.id} game={game} onSelect={handleSelectGame} />
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
