"use client";

import { usePetProfile } from "@/hooks/usePetProfile";
import { evaluate } from "@/lib/decision/evaluate";
import type { PetPolicyStructured } from "@/lib/parser/ruleBasedParser";
import { PolicyBadge, type PolicyStatus } from "@/components/PolicyBadge";

export function PetJudgementCard({ policy }: { policy: PetPolicyStructured }) {
  const { profile, isLoaded } = usePetProfile();

  if (!isLoaded || !profile) {
    return (
      <section className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950">
        <h2 className="mb-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">내 반려동물 기준 판정</h2>
        <p className="text-sm text-emerald-900 dark:text-emerald-200">
          내 반려동물 정보를 입력하면 맞춤 판정을 볼 수 있어요.{" "}
          <a href="/pet-profile" className="underline">
            반려동물 설정하러 가기
          </a>
        </p>
      </section>
    );
  }

  const result = evaluate(profile, policy);
  const status: PolicyStatus = result.verdict;

  return (
    <section className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950">
      <h2 className="mb-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300">내 반려동물 기준 판정</h2>
      <PolicyBadge status={status} reason={result.reason} />
    </section>
  );
}
