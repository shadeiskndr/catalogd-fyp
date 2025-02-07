"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { BeatLoader } from "react-spinners"
import Login from "@/components/landing/login"
import { getSessionData } from "@/utils/appwrite"

function Landing() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getSessionData()
      .then((data) => {
        if (data) {
          setLoggedIn(true)
          router.push("/dashboard")
        } else {
          setLoggedIn(false)
        }
        setLoading(false)
      })
      .catch((error) => {
        console.log(error)
        setLoading(false)
      })
  }, [router])

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <BeatLoader color="#ffa600" size={20} loading={true} />
      </div>
    )
  }

  return <main>{!loggedIn && <Login />}</main>
}

export default Landing
