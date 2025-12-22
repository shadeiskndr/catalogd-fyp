"use client";

import { useCallback, useState } from "react";
import { CatalogdLogo } from "@/components/catalogd-logo";
import { LoginForm } from "@/components/landing/login-form";
import { OAuthButtons } from "@/components/landing/oauth-buttons";
import { ColorThemeToggle } from "@/components/layout/color-theme-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { LightRays } from "@/components/ui/magicui/light-rays";
import { Separator } from "@/components/ui/separator";

export function Login() {
  const [isSignup, setIsSignup] = useState(false);

  const toggleMode = useCallback(() => {
    setIsSignup((current) => !current);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <LightRays
        className="pointer-events-none"
        color="rgba(160, 210, 255, 0.15)"
        blur={40}
        speed={14}
        length="80vh"
      />
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <ThemeToggle />
        <ColorThemeToggle />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-xs space-y-6">
        <div className="space-y-2 text-center">
          <CatalogdLogo className="mx-auto size-16 text-primary" />
          <h1 className="font-semibold text-3xl">{isSignup ? "Create Account" : "Welcome back"}</h1>
          <p className="text-muted-foreground">
            {isSignup ? "Sign up to start cataloging your games" : "Sign in to access Catalogd"}
          </p>
        </div>

        <div className="space-y-5">
          <OAuthButtons isSignup={isSignup} />

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-sm">
              or {isSignup ? "sign up" : "sign in"} with email
            </span>
            <Separator className="flex-1" />
          </div>

          <LoginForm isSignup={isSignup} />

          <div className="text-center text-sm">
            {isSignup ? "Already have an account? " : "No account? "}
            <Button onClick={toggleMode} variant="link" className="p-0" type="button">
              {isSignup ? "Sign in" : "Create an account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
