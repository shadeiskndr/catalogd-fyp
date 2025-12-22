import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Recommender | Catalogd",
};

export default function AiRecPage() {
  return (
    <div className="space-y-4 px-2 py-4">
      <h1 className="font-bold text-3xl">AI Recommender</h1>
      <iframe
        title="AI Game Recommender"
        src="https://ai-game-recommender.netlify.app"
        // react-doctor-disable-next-line react-doctor/iframe-missing-sandbox
        sandbox="allow-scripts allow-same-origin allow-forms"
        className="h-[1050px] w-full border-0"
        allowFullScreen
      />
    </div>
  );
}
