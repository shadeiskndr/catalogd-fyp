"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function LogoutButton() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [signOut, router]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={handleLogout} aria-label="Log out">
          <LogOut className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Log out</p>
      </TooltipContent>
    </Tooltip>
  );
}
