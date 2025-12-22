import Link from "next/link";
import { CatalogdLogo } from "@/components/catalogd-logo";

export function NavBrand() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-sidebar-accent"
    >
      <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <CatalogdLogo className="size-5" />
      </span>
      <span className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">Catalogd</span>
        <span className="truncate text-xs">Game Catalog</span>
      </span>
    </Link>
  );
}
