import { Suspense } from "react";
import { Featured, FeaturedSkeleton } from "@/components/dashboard/featured";
import { Upcoming, UpcomingSkeleton } from "@/components/dashboard/upcoming";

export default function DashboardPage() {
  return (
    <div className="space-y-8 px-2 py-4">
      <section>
        <h2 className="font-bold text-xl md:text-3xl">Featured</h2>
        <Suspense fallback={<FeaturedSkeleton />}>
          <Featured />
        </Suspense>
      </section>
      <section>
        <h2 className="font-bold text-xl md:text-3xl">New and Upcoming</h2>
        <Suspense fallback={<UpcomingSkeleton />}>
          <Upcoming />
        </Suspense>
      </section>
    </div>
  );
}
