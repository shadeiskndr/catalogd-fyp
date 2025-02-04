import Featured from "@/components/dashboard/Featured"
import Upcoming from "@/components/dashboard/Upcoming"

function Home() {
  return (
    <div className="py-4 px-2 space-y-8">
      <Featured />
      <Upcoming />
    </div>
  )
}

export default Home
