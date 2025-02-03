import Image from "next/image"
import React from "react"
import bgTop from "../public/imgs/4.jpg" // Adjust the path as needed

const BackgroundLanding = () => (
  <>
    <Image
      src={bgTop}
      alt="Background top"
      width={1280}
      height={720}
      className="absolute -z-30 top-0 blur-3xl opacity-70"
    />
    <div className="fixed -z-50 top-0 left-0 w-72 h-72 bg-[#d7da54f1] rounded-full blur-3xl opacity-70"></div>
    <div className="fixed -z-50 top-0 right-0 w-[400px] h-[400px] bg-[#325270a8] rounded-full blur-3xl opacity-70"></div>
    <div className="fixed bottom-0 left-0 -z-50 w-[500px] h-[500px] dark:bg-[#669194a8] rounded-full blur-3xl opacity-70"></div>
    <div className="fixed -z-50 -inset-y-0 w-[500px] h-[500px] md:w-[700px] md:h-[700px] bg-[#d7da54f1] dark:bg-[#669194a8] top-40 left-80 right-80 bottom-80 rounded-full blur-2xl opacity-70"></div>
    <div className="fixed -z-50 right-0 bottom-0 w-80 h-80 bg-[#325270a8] rounded-full blur-3xl opacity-80"></div>
  </>
)

export default BackgroundLanding
