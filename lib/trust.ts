// 02-design.md §7 신뢰도 지수 계산 로직 그대로 구현.
export type TrustDisplay = {
  label: string;
  scorePercent: number | null;
  reviewCount: number;
};

export function computeTrust(reviews: { stillAccurate: boolean; visitedOn: Date }[]): TrustDisplay {
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const recent = reviews.filter((r) => now - r.visitedOn.getTime() <= ninetyDaysMs);
  const n = recent.length;

  if (n === 0) {
    return { label: "검증된 후기 없음 (API 원문 기준)", scorePercent: null, reviewCount: 0 };
  }
  if (n <= 2) {
    return { label: `최근 확인 ${n}건`, scorePercent: null, reviewCount: n };
  }
  const accurate = recent.filter((r) => r.stillAccurate).length;
  const score = Math.round((accurate / n) * 100);
  return { label: `신뢰도 ${score}% (${n}건 기준)`, scorePercent: score, reviewCount: n };
}
