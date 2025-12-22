"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useCallback, useId, useState } from "react";
import { toast } from "sonner";
import { LoginField } from "@/components/landing/login-field";
import { Button } from "@/components/ui/button";

const MIN_PASSWORD_LENGTH = 8;

const EMPTY_FORM = { name: "", email: "", password: "", confirmPassword: "" };

function validate(isSignup: boolean, form: typeof EMPTY_FORM) {
  if (!isSignup) return null;
  if (form.password !== form.confirmPassword) return "Passwords do not match!";
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long!`;
  }
  return null;
}

function authErrorMessage(error: unknown, isSignup: boolean) {
  if (error instanceof ConvexError && typeof error.data === "string") return error.data;
  return isSignup
    ? "Could not create account. The email may already be in use."
    : "Invalid email or password.";
}

export function LoginForm({ isSignup }: { isSignup: boolean }) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const fieldId = useId();

  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const passwordId = `${fieldId}-password`;

  const toggleVisibility = useCallback(() => {
    setIsVisible((current) => !current);
  }, []);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const problem = validate(isSignup, form);
      if (problem !== null) {
        toast.error(problem);
        return;
      }

      setIsLoading(true);
      try {
        await signIn("password", {
          email: form.email,
          password: form.password,
          ...(isSignup ? { name: form.name, flow: "signUp" } : { flow: "signIn" }),
        });
        toast.success(isSignup ? "Account created successfully!" : "Logged in via email!");
        router.push("/dashboard");
      } catch (error) {
        console.error("Auth error:", error);
        toast.error(authErrorMessage(error, isSignup));
      } finally {
        setIsLoading(false);
      }
    },
    [form, isSignup, router, signIn]
  );

  const passwordToggle = (
    <button
      className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      onClick={toggleVisibility}
      disabled={isLoading}
      aria-label={isVisible ? "Hide password" : "Show password"}
      aria-pressed={isVisible}
      aria-controls={passwordId}
    >
      {isVisible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isSignup ? (
        <LoginField
          id={`${fieldId}-name`}
          name="name"
          label="Full Name"
          type="text"
          placeholder="Your name"
          value={form.name}
          icon={<User size={16} aria-hidden="true" />}
          disabled={isLoading}
          onChange={handleChange}
        />
      ) : null}

      <LoginField
        id={`${fieldId}-email`}
        name="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={form.email}
        icon={<Mail size={16} aria-hidden="true" />}
        disabled={isLoading}
        onChange={handleChange}
      />

      <LoginField
        id={passwordId}
        name="password"
        label="Password"
        type={isVisible ? "text" : "password"}
        placeholder="Enter your password"
        value={form.password}
        icon={<Lock size={16} aria-hidden="true" />}
        disabled={isLoading}
        onChange={handleChange}
        trailing={passwordToggle}
      />

      {isSignup ? (
        <LoginField
          id={`${fieldId}-confirm-password`}
          name="confirmPassword"
          label="Confirm Password"
          type={isVisible ? "text" : "password"}
          placeholder="Confirm your password"
          value={form.confirmPassword}
          icon={<Lock size={16} aria-hidden="true" />}
          disabled={isLoading}
          onChange={handleChange}
        />
      ) : null}

      <Button className="w-full" disabled={isLoading} type="submit">
        {isLoading ? "Loading..." : isSignup ? "Create Account" : "Sign in"}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
