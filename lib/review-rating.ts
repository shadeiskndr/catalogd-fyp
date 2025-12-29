export function ratingColor(rating: number) {
  if (rating >= 9) return "text-emerald-600 dark:text-emerald-400";
  if (rating >= 7) return "text-green-600 dark:text-green-400";
  if (rating >= 4) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function ratingTitle(rating: number) {
  if (rating === 10) return "Recommended, amazing! 😍";
  if (rating >= 7) return "Satisfied, good game. 😊";
  if (rating >= 4) return "Fine, an okay game. 😐";
  return "Avoid, terrible game. 😞";
}

export function ratingLabel(rating: number) {
  if (rating >= 9) return "Outstanding";
  if (rating >= 7) return "Good";
  if (rating >= 4) return "Mixed";
  return "Poor";
}

export function metacriticTone(score: number) {
  if (score >= 75) return "text-emerald-300";
  if (score >= 50) return "text-amber-300";
  return "text-red-300";
}

export function metacriticSurfaceTone(score: number) {
  if (score >= 75) return "text-emerald-700 dark:text-emerald-300";
  if (score >= 50) return "text-amber-700 dark:text-amber-300";
  return "text-red-700 dark:text-red-300";
}
