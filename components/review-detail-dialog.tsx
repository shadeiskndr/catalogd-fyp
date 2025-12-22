import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ratingColor } from "@/lib/review-rating";

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
      <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4 text-xl">{gameName}</DialogTitle>
          <ScrollArea className="flex max-h-full flex-col overflow-hidden">
            <div className="px-6 py-4">
              <div className="mb-4 flex items-center gap-2">
                <span className={`font-semibold text-md ${ratingColor(rating)}`}>{rating}</span>
                <Star className={`size-3 ${ratingColor(rating)}`} fill="currentColor" />
                <span className="text-muted-foreground text-sm">by {userName}</span>
              </div>
              <p className="whitespace-pre-wrap break-words leading-relaxed">{reviewText}</p>
            </div>
          </ScrollArea>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
