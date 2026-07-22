export function indoorLabel(v: string): string {
  switch (v) {
    case "yes":
      return "O";
    case "no":
      return "X";
    case "partial":
      return "조건부";
    default:
      return "확인필요";
  }
}

export function outdoorLabel(v: string): string {
  switch (v) {
    case "yes":
      return "O";
    case "no":
      return "X";
    default:
      return "확인필요";
  }
}

export function breedLabel(v: string): string {
  switch (v) {
    case "none":
      return "제한 없음";
    case "dangerous_breed_conditional":
      return "맹견은 입마개 착용 시 가능";
    default:
      return "확인필요";
  }
}

export function regionOf(addr1: string | null): string {
  if (!addr1) return "지역 미상";
  return addr1.trim().split(/\s+/)[0] ?? "지역 미상";
}

export const CONTENT_TYPE_LABEL: Record<number, string> = {
  12: "관광지",
  14: "문화시설",
  15: "행사/공연/축제",
  28: "레포츠",
  32: "숙박",
  38: "쇼핑",
  39: "음식점",
};
