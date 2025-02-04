"use client"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { account } from "@/utils/appwrite"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    try {
      account.deleteSession("current")
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleLogout}
      aria-label="Logout"
      title="Logout"
    >
      <LogOut className="size-4" />
    </Button>
  )
}
