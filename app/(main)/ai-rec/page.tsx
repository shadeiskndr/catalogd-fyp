import type { Metadata } from "next";
import { Suspense } from "react";
import {
  AiRecConversation,
  AiRecConversationSkeleton,
} from "@/components/ai-rec/ai-rec-conversation";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "AI Recommender | Catalogd",
};

export default function AiRecPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="AI Recommender"
        description="Tell it what you feel like playing. It searches 21,000 console games by meaning and can save picks straight to your lists."
      />
      <Suspense fallback={<AiRecConversationSkeleton />}>
        <AiRecConversation />
      </Suspense>
    </div>
  );
}
