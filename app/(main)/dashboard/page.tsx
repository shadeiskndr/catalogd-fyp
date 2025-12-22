import { Featured } from "@/components/dashboard/featured";
import { Upcoming } from "@/components/dashboard/upcoming";

export default function DashboardPage() {
  return (
    <div className="space-y-8 px-2 py-4">
      <Featured />
      <Upcoming />
    </div>
  );
}
