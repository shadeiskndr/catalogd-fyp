"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { SiDiscord, SiGoogle } from "@icons-pack/react-simple-icons";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function OAuthButtons({ isSignup }: { isSignup: boolean }) {
  const { signIn } = useAuthActions();

  const oAuthLogin = useCallback(
    (provider: "discord" | "google") => {
      signIn(provider, { redirectTo: "/dashboard" }).catch((error: unknown) => {
        console.error("OAuth login error:", error);
        toast.error("Failed to initiate OAuth login");
      });
    },
    [signIn]
  );

  const signInWithGoogle = useCallback(() => {
    oAuthLogin("google");
  }, [oAuthLogin]);

  const signInWithDiscord = useCallback(() => {
    oAuthLogin("discord");
  }, [oAuthLogin]);

  const verb = isSignup ? "Sign up" : "Sign in";

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-center gap-2"
        onClick={signInWithGoogle}
        type="button"
      >
        <SiGoogle className="size-4" />
        {verb} with Google
      </Button>

      <Button
        variant="outline"
        className="w-full justify-center gap-2"
        onClick={signInWithDiscord}
        type="button"
      >
        <SiDiscord className="size-4" />
        {verb} with Discord
      </Button>
    </>
  );
}
