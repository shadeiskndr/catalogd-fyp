import { metacriticTone } from "@/lib/review-rating";
import { cn } from "@/lib/utils";

export function MetacriticBadge({ score, className }: { score: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 font-semibold text-xs tabular-nums ring-1 ring-white/15 backdrop-blur-md",
        metacriticTone(score),
        className
      )}
      title={`Metacritic score ${score}`}
    >
      <span className="sr-only">Metacritic score</span>
      {score}
    </span>
  );
}
