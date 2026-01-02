"use client";

import { Bot } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Suggestion, Suggestions } from "@/components/ui/shadcn-io/suggestion";
import { AI_REC_SUGGESTIONS } from "@/lib/ai-rec-suggestions";

export function AiRecEmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <Empty className="flex-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Bot />
          </EmptyMedia>
          <EmptyTitle>What are you in the mood for?</EmptyTitle>
          <EmptyDescription>
            Describe a feeling, a mechanic or a game you loved. The recommender searches 21,000
            console games by meaning and shows the matches as cards.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
      <Suggestions className="justify-center">
        {AI_REC_SUGGESTIONS.map((suggestion) => (
          <Suggestion key={suggestion} suggestion={suggestion} onClick={onSuggestion} />
        ))}
      </Suggestions>
    </div>
  );
}
