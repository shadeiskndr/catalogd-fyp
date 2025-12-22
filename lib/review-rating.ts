export function ratingColor(rating: number) {
  if (rating === 10) return "text-green-400";
  if (rating >= 7) return "text-green-600";
  if (rating >= 4) return "text-yellow-400";
  return "text-red-500";
}

export function ratingTitle(rating: number) {
  if (rating === 10) return "Recommended, amazing! 😍";
  if (rating >= 7) return "Satisfied, good game. 😊";
  if (rating >= 4) return "Fine, an okay game. 😐";
  return "Avoid, terrible game. 😞";
}
