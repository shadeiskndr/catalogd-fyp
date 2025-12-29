import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 pt-6 pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        className
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow === undefined ? null : (
          <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {eyebrow}
          </div>
        )}
        <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">{title}</h1>
        {description === undefined ? null : (
          <p className="max-w-prose text-muted-foreground text-sm leading-relaxed">{description}</p>
        )}
      </div>
      {actions === undefined ? null : (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
