import { Suspense } from "react";
import { Featured, FeaturedSkeleton } from "@/components/dashboard/featured";
import { Upcoming, UpcomingSkeleton } from "@/components/dashboard/upcoming";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A fresh pick of well-reviewed console games, plus what is landing next."
      />
      <div className="space-y-10">
        <section className="space-y-4">
          <SectionHeader
            title="Featured"
            description="Three highly rated games, reshuffled on every visit."
            href="/popular"
            linkLabel="Most popular"
          />
          <Suspense fallback={<FeaturedSkeleton />}>
            <Featured />
          </Suspense>
        </section>
        <section className="space-y-4">
          <SectionHeader
            title="New and Upcoming"
            description="The next wave of console releases."
            href="/new-releases"
            linkLabel="Release calendar"
          />
          <Suspense fallback={<UpcomingSkeleton />}>
            <Upcoming />
          </Suspense>
        </section>
      </div>
    </>
  );
}
