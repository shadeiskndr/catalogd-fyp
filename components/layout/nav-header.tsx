"use client"

import { Gamepad2, Loader2, Search } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useEffect, useState } from "react"
import { TeamSwitcher } from "@/components/layout/team-switcher"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { SidebarHeader } from "@/components/ui/sidebar"
import { useDebounceCallback } from "@/hooks/use-debounce-callback"
import { useGameSearch } from "@/hooks/use-games-extended"
import placeholderImg from "@/public/imgs/imgPlaceholder.jpg"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavHeaderProps {
  items: NavItem[]
  isCollapsed?: boolean
}

export function NavHeader({ items, isCollapsed = false }: NavHeaderProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")
  const router = useRouter()
  const { data: searchData, isLoading } = useGameSearch(debouncedSearchTerm)
  const searchedGames = searchData?.results || []

  // Debounce search term updates
  const debouncedSetSearchTerm = useDebounceCallback(
    (value: string) => setDebouncedSearchTerm(value),
    500,
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  if (isCollapsed) {
    return (
      <>
        <SidebarHeader className="flex flex-col gap-2">
          <TeamSwitcher
            teams={[
              {
                name: "Catalogd",
                logo: Gamepad2,
                plan: "Game Catalog",
              },
            ]}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="w-full"
            title="Search (⌘K)"
          >
            <Search className="size-4" />
          </Button>
        </SidebarHeader>

        <CommandDialog
          open={open}
          onOpenChange={(newOpen) => {
            setOpen(newOpen)
            if (!newOpen) setSearchTerm("")
          }}
        >
          <CommandInput
            placeholder="Search games and navigation..."
            value={searchTerm}
            onInput={(e) => {
              const value = e.currentTarget.value
              setSearchTerm(value)
              debouncedSetSearchTerm(value)
            }}
          />
          <CommandList>
            {debouncedSearchTerm.length > 2 && isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mb-2 size-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : (
              <CommandEmpty>No results found.</CommandEmpty>
            )}

            {/* Navigation Group */}
            <CommandGroup heading="Navigation">
              {items.map((item) => (
                <CommandItem
                  className="py-2"
                  key={item.url}
                  onSelect={() => {
                    setOpen(false)
                    window.location.href = item.url
                  }}
                >
                  <item.icon className="mr-2 size-4" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Games Group */}
            {debouncedSearchTerm.length > 2 && (
              <CommandGroup heading="Games">
                {searchedGames && searchedGames.length > 0 ? (
                  searchedGames.map((game) => (
                    <CommandItem
                      className="py-2"
                      key={game.slug}
                      value={game.slug}
                      onSelect={() => {
                        setOpen(false)
                        setSearchTerm("")
                        router.push(`/game/${game.slug}`)
                      }}
                    >
                      {game.background_image && (
                        <Image
                          src={game.background_image || placeholderImg}
                          alt={game.name}
                          width={32}
                          height={32}
                          className="mr-2 size-8 rounded"
                        />
                      )}
                      <div className="flex flex-col">
                        <span>{game.name}</span>
                        {game.released && (
                          <span className="text-xs opacity-50">
                            {game.released}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))
                ) : (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    No games found
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
      </>
    )
  }

  return (
    <>
      <SidebarHeader className="flex flex-col gap-4">
        <div className="py-2">
          <TeamSwitcher
            teams={[
              {
                name: "Catalogd",
                logo: Gamepad2,
                plan: "Game Catalog",
              },
            ]}
          />
        </div>
        <InputGroup onClick={() => setOpen(true)} className="cursor-pointer">
          <InputGroupAddon align="inline-start">
            <Search className="h-4 w-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search"
            readOnly
            className="cursor-pointer"
          />
          <InputGroupAddon align="inline-end">
            <kbd className="text-muted-foreground inline-flex font-[inherit] text-xs font-medium">
              <span className="opacity-70">⌘K</span>
            </kbd>
          </InputGroupAddon>
        </InputGroup>
      </SidebarHeader>

      <CommandDialog
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen)
          if (!newOpen) setSearchTerm("")
        }}
      >
        <CommandInput
          placeholder="Search games and navigation..."
          value={searchTerm}
          onInput={(e) => {
            const value = e.currentTarget.value
            setSearchTerm(value)
            debouncedSetSearchTerm(value)
          }}
        />
        <CommandList>
          {debouncedSearchTerm.length > 2 && isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mb-2 size-4 animate-spin" />
              <span>Searching...</span>
            </div>
          ) : (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {/* Navigation Group */}
          <CommandGroup heading="Navigation">
            {items.map((item) => (
              <CommandItem
                className="py-2"
                key={item.url}
                onSelect={() => {
                  setOpen(false)
                  window.location.href = item.url
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Games Group */}
          {debouncedSearchTerm.length > 2 && (
            <CommandGroup heading="Games">
              {searchedGames && searchedGames.length > 0 ? (
                searchedGames.map((game) => (
                  <CommandItem
                    className="py-2"
                    key={game.slug}
                    value={game.slug}
                    onSelect={() => {
                      setOpen(false)
                      setSearchTerm("")
                      router.push(`/game/${game.slug}`)
                    }}
                  >
                    {game.background_image && (
                      <Image
                        src={game.background_image || placeholderImg}
                        alt={game.name}
                        width={32}
                        height={32}
                        className="mr-2 size-8 rounded"
                      />
                    )}
                    <div className="flex flex-col">
                      <span>{game.name}</span>
                      {game.released && (
                        <span className="text-xs opacity-50">
                          {game.released}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))
              ) : (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No games found
                </div>
              )}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
