"use client"
import Hero from "@/components/landing/Hero"
import { getSessionData } from "@/utils/appwrite"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { BeatLoader } from "react-spinners"
import BackgroundLanding from "@/components/BackgroundLanding" // Import the BackgroundLanding component

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

  return (
    <main>
      {!loggedIn && (
        <div className="relative">
          <BackgroundLanding />
          <section className="p-5 lg:p-16">
            <Hero />
          </section>
        </div>
      )}
    </main>
  )
}

export default Landing
