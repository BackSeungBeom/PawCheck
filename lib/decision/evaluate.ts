// 02-design.md §8 개인화 판정 로직 그대로 구현.
import type { PetPolicyStructured } from "@/lib/parser/ruleBasedParser";

export type PetProfile = {
  breed: string;
  isDangerousBreed: boolean;
  hasLeash: boolean;
  hasMuzzle: boolean;
};

export type Verdict = "가능" | "조건부" | "확인필요";

export type EvaluationResult = {
  verdict: Verdict;
  reason: string;
};

export function evaluate(pet: PetProfile, policy: PetPolicyStructured): EvaluationResult {
  if (policy.needsManualCheck) {
    return {
      verdict: "확인필요",
      reason: "규정 원문의 표현이 표준 패턴과 달라 자동 판별하지 못했습니다. 원문을 직접 확인해주세요.",
    };
  }

  if (policy.breedRestriction === "dangerous_breed_conditional" && pet.isDangerousBreed) {
    if (pet.hasMuzzle) {
      return { verdict: "가능", reason: "맹견이지만 입마개를 소지하고 있어 입장 가능합니다." };
    }
    return {
      verdict: "조건부",
      reason: "맹견은 입마개 착용 시 입장 가능합니다. 입마개를 챙겨오세요.",
    };
  }

  if (policy.leashRequired && !pet.hasLeash) {
    return { verdict: "조건부", reason: "목줄 착용이 필수입니다. 목줄을 챙겨오세요." };
  }

  return { verdict: "가능", reason: "확인된 규정 기준으로 입장 가능합니다." };
}
