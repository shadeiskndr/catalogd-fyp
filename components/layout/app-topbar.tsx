"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { ColorThemeToggle } from "@/components/layout/color-theme-toggle";
import { LogoutButton } from "@/components/layout/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { NAV_ITEMS } from "@/lib/nav-items";

type Crumb = { label: string; href?: string };

const SEGMENT_LABELS: Record<string, string> = {
  game: "Games",
  genres: "Genres",
};

function titleCase(segment: string): string {
  return segment
    .split("-")
    .map((word) => (word.length === 0 ? word : `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`))
    .join(" ");
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter((segment) => segment.length > 0);
  const [first, second] = segments;

  if (first === undefined) {
    return [{ label: "Dashboard" }];
  }

  const navItem = NAV_ITEMS.find((item) => item.url === `/${first}`);
  const rootLabel = navItem?.title ?? SEGMENT_LABELS[first] ?? titleCase(first);

  if (second === undefined) {
    return [{ label: rootLabel }];
  }

  return [
    { label: rootLabel, ...(navItem === undefined ? {} : { href: navItem.url }) },
    { label: titleCase(second) },
  ];
}

export function AppTopbar() {
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();

  const userName = user?.name;
  const crumbs = buildCrumbs(pathname);
  const last = crumbs[crumbs.length - 1];

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex min-w-0 items-center gap-2 px-3 md:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            {crumbs.slice(0, -1).map((crumb) => (
              <Fragment key={crumb.label}>
                <BreadcrumbItem className="hidden sm:flex">
                  {crumb.href === undefined ? (
                    <span className="text-muted-foreground">{crumb.label}</span>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href} prefetch>
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
              </Fragment>
            ))}
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">{last?.label ?? "Dashboard"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex shrink-0 items-center gap-1 px-3 md:gap-2 md:px-4">
        <div className="mr-1 hidden min-w-24 justify-end text-right md:flex">
          {isLoading ? <Skeleton className="h-4 w-28 rounded-full" /> : null}
          {!isLoading && userName !== undefined ? (
            <span className="truncate text-muted-foreground text-sm">
              Welcome, <span className="font-medium text-foreground">{userName}</span>
            </span>
          ) : null}
        </div>
        <Separator
          orientation="vertical"
          className="hidden data-[orientation=vertical]:h-4 md:block"
        />
        <ColorThemeToggle />
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
