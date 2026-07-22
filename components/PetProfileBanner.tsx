"use client";

import { useState } from "react";
import Link from "next/link";
import { usePetProfile } from "@/hooks/usePetProfile";

export function PetProfileBanner() {
  const { profile, isLoaded } = usePetProfile();
  const [dismissed, setDismissed] = useState(false);

  if (!isLoaded || profile || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-50 px-6 py-2.5 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <span>🐶 내 반려동물 정보를 입력하면 시설별 맞춤 판정을 받을 수 있어요.</span>
      <div className="flex shrink-0 items-center gap-3">
        <Link href="/pet-profile" className="font-semibold underline">
          설정하기
        </Link>
        <button type="button" onClick={() => setDismissed(true)} className="text-amber-700/70 hover:text-amber-900 dark:text-amber-300/70 dark:hover:text-amber-100">
          닫기
        </button>
      </div>
    </div>
  );
}
