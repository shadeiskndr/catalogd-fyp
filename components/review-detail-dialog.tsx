import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ratingColor, ratingLabel } from "@/lib/review-rating";
import { cn } from "@/lib/utils";

type ReviewDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameName: string;
  userName: string;
  rating: number;
  reviewText: string;
};

export function ReviewDetailDialog({
  open,
  onOpenChange,
  gameName,
  userName,
  rating,
  reviewText,
}: ReviewDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(640px,80vh)] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="contents space-y-0 text-left">
          <div className="space-y-2 border-b px-6 py-4 pr-12">
            <DialogTitle className="text-xl leading-snug">{gameName}</DialogTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="flex items-center gap-1">
                <span className={cn("font-semibold tabular-nums", ratingColor(rating))}>
                  {rating}
                </span>
                <span className="text-muted-foreground">/ 10</span>
                <Star className={cn("size-3.5", ratingColor(rating))} fill="currentColor" />
              </span>
              <span className="text-muted-foreground">{ratingLabel(rating)}</span>
              <span className="text-muted-foreground">
                by <span className="text-foreground">{userName}</span>
              </span>
            </div>
          </div>
          <ScrollArea className="flex max-h-full flex-col overflow-hidden">
            <p className="whitespace-pre-wrap break-words px-6 py-5 text-sm leading-relaxed">
              {reviewText}
            </p>
          </ScrollArea>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
