type Problem = {
  id: string;
  rating: number | null;
  tags: string[];
};

export function scoreProblems(
  problems: Problem[],
  weakTags: string[],
  targetRating: number,
  limit = 3
) {
  return problems
    .map(problem => {
      // count overlapping weak tags
      const tagMatches = problem.tags.filter(tag =>
        weakTags.includes(tag)
      ).length;

      // rating closeness (smaller is better)
      const ratingDiff =
        problem.rating !== null
          ? Math.abs(problem.rating - targetRating)
          : 300;

      const score =
        tagMatches * 3 - ratingDiff / 100;

      return { ...problem, score };
    })
    .sort((a, b) => b.score - a.score) // highest score first
    .slice(0, limit);
}
