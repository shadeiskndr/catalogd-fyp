import { ArrowRight } from "lucide-react";
import Link from "next/link";

type SectionHeaderProps = {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeader({ title, description, href, linkLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h2 className="font-bold text-xl tracking-tight sm:text-2xl">{title}</h2>
        {description === undefined ? null : (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {href === undefined ? null : (
        <Link
          href={href}
          prefetch
          className="group flex shrink-0 items-center gap-1 rounded-md text-muted-foreground text-sm transition-colors duration-150 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span>{linkLabel ?? "View all"}</span>
          <ArrowRight className="size-4 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
