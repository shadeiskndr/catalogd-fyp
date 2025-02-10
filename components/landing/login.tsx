"use client"

import { ID } from "appwrite"
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"
import { toast } from "react-hot-toast"
import { BsDiscord, BsGoogle } from "react-icons/bs"
import { ColorThemeToggle } from "@/components/layout/color-theme-toggle"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Logo } from "@/components/ui/blocks-so/logo"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { LightRays } from "@/components/ui/magicui/light-rays"
import { account } from "@/utils/appwrite"

export default function Login07() {
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const [isSignup, setIsSignup] = useState(false)
  const [isPasswordReset, setIsPasswordReset] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [userDetails, setUserDetails] = useState({
    email: "",
    password: "",
  })

  const [signupDetails, setSignupDetails] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const toggleVisibility = () => setIsVisible((prevState) => !prevState)

  const oAuthLogin = () => {
    try {
      account.createOAuth2Session(
        "discord",
        "https://catalogd-fyp.vercel.app/dashboard",
      )
    } catch (error) {
      console.error("OAuth login error:", error)
      toast.error("Failed to initiate Discord login")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (isSignup) {
      setSignupDetails((prev) => ({
        ...prev,
        [name]: value,
      }))
    } else {
      setUserDetails((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const loginUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isSignup) {
        if (signupDetails.password !== signupDetails.confirmPassword) {
          toast.error("Passwords do not match!")
          setIsLoading(false)
          return
        }
        if (signupDetails.password.length < 8) {
          toast.error("Password must be at least 8 characters long!")
          setIsLoading(false)
          return
        }

        await account.create(
          ID.unique(),
          signupDetails.email,
          signupDetails.password,
          signupDetails.name,
        )

        toast.success("Account created successfully!")

        await account.createEmailSession(
          signupDetails.email,
          signupDetails.password,
        )

        toast.success("Logged in via email!")
        router.push("/dashboard")
      } else {
        await account.createEmailSession(
          userDetails.email,
          userDetails.password,
        )
        toast.success("Logged in via email!")
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast.error(error?.message || "Authentication failed")
      console.error("Auth error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const forgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await account.createRecovery(
        userDetails.email,
        "https://catalogd-fyp.vercel.app/resetPass",
      )
      toast.success("Please check your email for password reset instructions.")
      setIsPasswordReset(false)
    } catch (error: any) {
      toast.error(error?.message || "Failed to send reset email")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
      <LightRays
        className="pointer-events-none"
        color="rgba(160, 210, 255, 0.15)"
        blur={40}
        speed={14}
        length="80vh"
      />
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <ThemeToggle />
        <ColorThemeToggle />
      </div>
      <div className="mx-auto w-full max-w-xs space-y-6 relative z-10">
        <div className="space-y-2 text-center">
          <Logo className="mx-auto h-16 w-16" />
          <h1 className="text-3xl font-semibold">
            {isSignup ? "Create Account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground">
            {isSignup
              ? "Sign up to start cataloging your games"
              : "Sign in to access Catalogd"}
          </p>
        </div>

        <div className="space-y-5">
          <Button variant="outline" className="w-full justify-center gap-2">
            <BsGoogle className="h-4 w-4" />
            {isSignup ? "Sign up with Google" : "Sign in with Google"}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={oAuthLogin}
            type="button"
          >
            <BsDiscord className="h-4 w-4" />
            {isSignup ? "Sign up with Discord" : "Sign in with Discord"}
          </Button>

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">
              or {isSignup ? "sign up" : "sign in"} with email
            </span>
            <Separator className="flex-1" />
          </div>

          <form
            onSubmit={isSignup ? loginUser : loginUser}
            className="space-y-6"
          >
            {isSignup && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="relative mt-2.5">
                  <Input
                    id="name"
                    name="name"
                    className="peer ps-9"
                    placeholder="Your name"
                    type="text"
                    value={signupDetails.name}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <Mail size={16} aria-hidden="true" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-2.5">
                <Input
                  id="email"
                  name="email"
                  className="peer ps-9"
                  placeholder="Enter your email"
                  type="email"
                  value={isSignup ? signupDetails.email : userDetails.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <Mail size={16} aria-hidden="true" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={() => setIsPasswordReset(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative mt-2.5">
                <Input
                  id="password"
                  name="password"
                  className="ps-9 pe-9"
                  placeholder="Enter your password"
                  type={isVisible ? "text" : "password"}
                  value={
                    isSignup ? signupDetails.password : userDetails.password
                  }
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <Lock size={16} aria-hidden="true" />
                </div>
                <button
                  className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={toggleVisibility}
                  disabled={isLoading}
                  aria-label={isVisible ? "Hide password" : "Show password"}
                  aria-pressed={isVisible}
                  aria-controls="password"
                >
                  {isVisible ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {isSignup && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative mt-2.5">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    className="ps-9 pe-9"
                    placeholder="Confirm your password"
                    type={isVisible ? "text" : "password"}
                    value={signupDetails.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <Lock size={16} aria-hidden="true" />
                  </div>
                </div>
              </div>
            )}

            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading
                ? "Loading..."
                : isSignup
                  ? "Create Account"
                  : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="text-center text-sm">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <Button
                  onClick={() => setIsSignup(false)}
                  variant="link"
                  className="p-0"
                >
                  Sign in
                </Button>
              </>
            ) : (
              <>
                No account?{" "}
                <Button
                  onClick={() => setIsSignup(true)}
                  variant="link"
                  className="p-0"
                >
                  Create an account
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isPasswordReset} onOpenChange={setIsPasswordReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={forgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email"
                value={userDetails.email}
                onChange={handleInputChange}
                name="email"
                disabled={isLoading}
                className="mt-2"
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Email"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsPasswordReset(false)}
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
