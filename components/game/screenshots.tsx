"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ScreenshotItem } from "@/lib/game-types";
import { rawgImage } from "@/lib/rawg-image";

type ScreenshotThumbProps = {
  screenshot: ScreenshotItem;
  index: number;
  gameName: string;
  priority: boolean;
  onOpen: (index: number) => void;
};

function ScreenshotThumb({ screenshot, index, gameName, priority, onOpen }: ScreenshotThumbProps) {
  const handleClick = useCallback(() => {
    onOpen(index);
  }, [index, onOpen]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`View screenshot ${index + 1} of ${gameName}`}
      className="ease relative aspect-video overflow-hidden rounded-lg border bg-muted transition-[border-color,box-shadow] duration-150 hover-hover:hover:border-ring/60 hover-hover:hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.99]"
    >
      <Image
        src={rawgImage(screenshot.image, 640)}
        alt=""
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        loading={priority ? "eager" : "lazy"}
        className="object-cover"
      />
    </button>
  );
}

export function Screenshots({
  screenshots,
  gameName,
}: {
  screenshots: ScreenshotItem[];
  gameName: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setActiveIndex(null);
    }
  }, []);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) =>
      current === null ? null : (current - 1 + screenshots.length) % screenshots.length
    );
  }, [screenshots.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => (current === null ? null : (current + 1) % screenshots.length));
  }, [screenshots.length]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      }
    },
    [showNext, showPrevious]
  );

  if (screenshots.length === 0) {
    return <p className="text-muted-foreground text-sm">No screenshots available.</p>;
  }

  const active = activeIndex === null ? undefined : screenshots[activeIndex];

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {screenshots.map((screenshot, index) => (
          <ScreenshotThumb
            key={screenshot.id}
            screenshot={screenshot}
            index={index}
            gameName={gameName}
            priority={index < 3}
            onOpen={setActiveIndex}
          />
        ))}
      </div>

      <Dialog open={active !== undefined} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          onKeyDown={handleKeyDown}
          overlayClassName="bg-black/85 backdrop-blur-sm"
          className="max-w-[min(96vw,1200px)] gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-[min(96vw,1200px)]"
        >
          <DialogTitle className="sr-only">
            {gameName} screenshot {(activeIndex ?? 0) + 1} of {screenshots.length}
          </DialogTitle>
          {active === undefined ? null : (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              <Image
                src={rawgImage(active.image, 1280)}
                alt={`${gameName} screenshot`}
                fill
                sizes="96vw"
                className="object-contain"
              />
              {screenshots.length > 1 ? (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={showPrevious}
                    aria-label="Previous screenshot"
                    className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full opacity-80 transition-[opacity,transform] duration-150 ease-out hover:opacity-100 active:scale-90"
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={showNext}
                    aria-label="Next screenshot"
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full opacity-80 transition-[opacity,transform] duration-150 ease-out hover:opacity-100 active:scale-90"
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                </>
              ) : null}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-white text-xs tabular-nums ring-1 ring-white/15 backdrop-blur-md">
                {(activeIndex ?? 0) + 1} / {screenshots.length}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={close}
                className="absolute top-3 right-3 rounded-full opacity-80 transition-opacity duration-150 ease-out hover:opacity-100"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
