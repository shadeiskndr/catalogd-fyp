import Link from "next/link";
import { CatalogdLogo } from "@/components/catalogd-logo";

export function NavBrand() {
  return (
    <Link
      href="/dashboard"
      prefetch
      className="flex items-center gap-2 rounded-md py-1 transition-colors duration-150 ease-out hover:bg-sidebar-accent group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
    >
      <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <CatalogdLogo className="size-5" />
      </span>
      <span className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate font-medium">Catalogd</span>
        <span className="truncate text-muted-foreground text-xs">Game Catalog</span>
      </span>
    </Link>
  );
}
