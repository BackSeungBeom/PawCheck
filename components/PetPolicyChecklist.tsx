"use client";

import { useState } from "react";
import { breedLabel, indoorLabel, outdoorLabel } from "@/lib/format";

type ExceptionArea = { scope: string; allowed: boolean };

export type PetPolicyChecklistProps = {
  policy: {
    indoorAllowed: string;
    outdoorAllowed: string;
    breedRestriction: string;
    muzzleRequired: boolean;
    leashRequired: boolean;
    needsManualCheck: boolean;
  };
  raw: {
    acmpyTypeCd: string | null;
    acmpyPsblCpam: string | null;
    acmpyNeedMtr: string | null;
  };
  exceptionAreas?: ExceptionArea[];
};

export function PetPolicyChecklist({ policy, raw, exceptionAreas }: PetPolicyChecklistProps) {
  const [showRaw, setShowRaw] = useState(false);

  const rows: [string, string][] = [
    ["실내 동반 가능", indoorLabel(policy.indoorAllowed)],
    ["실외 동반 가능", outdoorLabel(policy.outdoorAllowed)],
    ["맹견 제한", breedLabel(policy.breedRestriction)],
    ["목줄 착용 필수", policy.leashRequired ? "O" : "X"],
    ["입마개 필요(맹견 한정)", policy.muzzleRequired ? "O" : "X"],
    ["시설 내 예외구역", exceptionAreas && exceptionAreas.length > 0 ? `있음 (${exceptionAreas.length}건)` : "없음"],
  ];

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-black/5 last:border-b-0 dark:border-white/5">
              <td className="px-4 py-2.5 text-black/60 dark:text-white/60">{label}</td>
              <td className="px-4 py-2.5 text-right font-medium">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {policy.needsManualCheck && (
        <div className="border-t border-black/5 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 dark:border-white/5 dark:bg-gray-900 dark:text-gray-300">
          ❓ 일부 항목은 패턴이 명확하지 않아 자동 판별하지 못했습니다. 원문을 직접 확인해주세요.
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowRaw((v) => !v)}
        className="w-full border-t border-black/5 px-4 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50 dark:border-white/5 dark:text-emerald-400 dark:hover:bg-emerald-950"
      >
        {showRaw ? "▲ 원문 숨기기" : "▼ 원문 보기 (공사 API 원문)"}
      </button>

      {showRaw && (
        <div className="space-y-2 border-t border-black/5 px-4 py-3 text-sm dark:border-white/5">
          <div>
            <span className="font-medium text-black/60 dark:text-white/60">동반유형(acmpyTypeCd): </span>
            {raw.acmpyTypeCd || "정보 없음"}
          </div>
          <div>
            <span className="font-medium text-black/60 dark:text-white/60">동반가능동물(acmpyPsblCpam): </span>
            {raw.acmpyPsblCpam || "정보 없음"}
          </div>
          <div>
            <span className="font-medium text-black/60 dark:text-white/60">동반시 필요사항(acmpyNeedMtr): </span>
            {raw.acmpyNeedMtr || "정보 없음"}
          </div>
        </div>
      )}
    </div>
  );
}
