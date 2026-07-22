import { computeTrust } from "@/lib/trust";

export function TrustScoreBadge({ reviews }: { reviews: { stillAccurate: boolean; visitedOn: Date }[] }) {
  const trust = computeTrust(reviews);
  const tone =
    trust.scorePercent === null
      ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
      : trust.scorePercent >= 70
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{trust.label}</span>
  );
}
