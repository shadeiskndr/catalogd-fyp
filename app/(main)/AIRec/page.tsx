const AIRecommender = () => {
  return (
    <div className="space-y-4 py-4 px-2">
      <h1 className="text-3xl font-bold">AI Recommender</h1>
      <div className="iframe-container">
        <iframe
          title="AI Game Recommender"
          src="https://ai-game-recommender.netlify.app" // Replace with the URL of the website you want to embed
          width="100%"
          height="1050px"
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </div>
  )
}

export default AIRecommender
