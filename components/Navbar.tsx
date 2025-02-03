"use client"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react"
import { ImExit } from "react-icons/im"
import { account, getSessionData } from "@/utils/appwrite"
import { SidebarContext } from "@/utils/SidebarContext"
import logo from "../public/imgs/nekored.webp"
import SeachBar from "./SeachBar"

const Navbar = () => {
  const { isSidebarOpen, setIsSidebarOpen } = useContext(SidebarContext)
  const [session, setSession] = useState<any>(null)
  const router = useRouter()

  const handleLogoClick = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const oAuthLogout = () => {
    console.log("Logging out...")
    try {
      account.deleteSession("current")
      console.log("Logged out!")
      router.push("/")
    } catch (AppwriteException) {
      console.error("OAuth logout error:", AppwriteException)
    }
  }

  useEffect(() => {
    ;(async () => {
      setSession(await getSessionData())
    })()
  }, [])

  return (
    <nav className="flex flex-col space-y-1/2 bg-black">
      <div className="flex justify-between items-center">
        <div className="p-2 pl-0 w-20 flex items-center space-x-6">
          <Image
            onClick={handleLogoClick}
            className="rounded-e-full"
            src={logo}
            alt="Logo"
            width={100}
            height={100}
            priority
          />
          <div className="hidden md:block">
            <SeachBar />
          </div>
          <div className="flex flex-col space-x-2 md:hidden font-bold">
            <h1 className="text-2xl text-indigo-300">Catalogd</h1>
            <div className="text-xs text-gray-600 flex space-x-1">
              <Link href="" target="_blank">
                <h1 className="text-gray-600 hover:text-gray-100 transition duration-300 hover:scale-105 cursor-pointer">
                  Discover
                </h1>
              </Link>
              <h2>Your</h2>
              <Link href="" target="_blank">
                <h1 className="text-gray-600 hover:text-red-500 transition duration-300 hover:scale-105 cursor-pointer">
                  Games
                </h1>
              </Link>
            </div>
          </div>
        </div>

        <ul className="flex space-x-10 mr-4 text-gray-100 items-center">
          <li className="hidden md:block">
            <h2 className="font-semibold text-xl">
              Welcome,{" "}
              {/** biome-ignore lint/style/noNonNullAssertion: <leave it> */}
              {/** biome-ignore lint/suspicious/noNonNullAssertedOptionalChain: <leave it> */}
              {session?.name!}!
            </h2>
          </li>
          <li>
            {/** biome-ignore lint/a11y/useButtonType: <leave it> */}
            <button
              onClick={() => oAuthLogout()}
              className="cursor-pointer"
              aria-label="Logout"
              name="Logout"
              title="Logout"
            >
              <ImExit color="#a1bcc7" size={30} />
            </button>
          </li>
        </ul>
      </div>
      <span className="bg-linear-to-r from-red-600 via-red-400 to-red-600  blur-[1px] h-1"></span>
    </nav>
  )
}

export default Navbar
