"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CONTENT_TYPE_LABEL, breedLabel, indoorLabel, outdoorLabel } from "@/lib/format";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";

type CardFacility = {
  id: string;
  title: string;
  contentTypeId: number;
  addr1: string | null;
  firstImage: string | null;
  policy: {
    indoorAllowed: string;
    outdoorAllowed: string;
    breedRestriction: string;
  } | null;
  reviews: { stillAccurate: boolean; visitedOn: Date }[];
};

export function FacilityCompareGrid({ facilities }: { facilities: CardFacility[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  }

  const atLimit = selected.length >= 3;

  return (
    <div className="pb-16">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {facilities.map((f) => {
          const isSelected = selected.includes(f.id);
          return (
            <div
              key={f.id}
              className="relative flex flex-col overflow-hidden rounded-xl border border-black/10 transition-shadow hover:shadow-md dark:border-white/10"
            >
              <label className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs shadow dark:bg-black/70">
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!isSelected && atLimit}
                  onChange={() => toggle(f.id)}
                />
                비교
              </label>
              <Link href={`/facilities/${f.id}`} className="flex flex-1 flex-col">
                <div className="relative h-36 w-full bg-emerald-50 dark:bg-emerald-950">
                  {f.firstImage ? (
                    <Image src={f.firstImage} alt={f.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">🐾</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{f.title}</h3>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {CONTENT_TYPE_LABEL[f.contentTypeId] ?? f.contentTypeId}
                    </span>
                  </div>
                  <p className="text-sm text-black/50 dark:text-white/50">{f.addr1 ?? "주소 정보 없음"}</p>
                  {f.policy && (
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <span className="rounded-full border border-black/10 px-2 py-0.5 dark:border-white/10">
                        실내 {indoorLabel(f.policy.indoorAllowed)}
                      </span>
                      <span className="rounded-full border border-black/10 px-2 py-0.5 dark:border-white/10">
                        실외 {outdoorLabel(f.policy.outdoorAllowed)}
                      </span>
                      <span className="rounded-full border border-black/10 px-2 py-0.5 dark:border-white/10">
                        {breedLabel(f.policy.breedRestriction)}
                      </span>
                    </div>
                  )}
                  <div className="mt-auto pt-1">
                    <TrustScoreBadge reviews={f.reviews} />
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-center border-t border-black/10 bg-white/95 px-6 py-3 backdrop-blur dark:border-white/10 dark:bg-black/90">
          <div className="flex w-full max-w-5xl items-center justify-between">
            <span className="text-sm">
              {selected.length}개 선택됨{atLimit && " (최대 3개까지 비교 가능)"}
            </span>
            <button
              type="button"
              disabled={selected.length < 2}
              onClick={() => router.push(`/facilities/compare?ids=${selected.join(",")}`)}
              className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-40"
            >
              비교하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
