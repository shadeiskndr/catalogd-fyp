"use client";

import { SiGithub, SiX } from "@icons-pack/react-simple-icons";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const SOCIALS = [
  { name: "GitHub", url: "https://github.com/shadeiskndr", Icon: SiGithub },
  { name: "X", url: "https://x.com/shadeiskndr", Icon: SiX },
];

export function SocialLinks() {
  return (
    <div className="space-y-3 text-center">
      <div className="flex items-center justify-center gap-2">
        {SOCIALS.map(({ name, url, Icon }) => (
          <Button key={name} asChild variant="ghost" size="icon-sm">
            <a href={url} target="_blank" rel="noreferrer" aria-label={name}>
              <Icon className="size-4" />
            </a>
          </Button>
        ))}
      </div>
      <p className="flex flex-wrap items-center justify-center gap-x-1 text-muted-foreground text-xs">
        Built with
        <Heart className="size-3 text-red-500" fill="currentColor" />
        by Shahathir Iskandar
      </p>
    </div>
  );
}
