"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePetProfile } from "@/hooks/usePetProfile";
import type { PetProfile } from "@/lib/decision/evaluate";

const EMPTY: PetProfile = {
  breed: "",
  isDangerousBreed: false,
  hasLeash: false,
  hasMuzzle: false,
};

export default function PetProfilePage() {
  const router = useRouter();
  const { profile, setProfile, clearProfile, isLoaded } = usePetProfile();
  const [form, setForm] = useState<PetProfile>(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isLoaded && profile) setForm(profile);
  }, [isLoaded, profile]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold">내 반려동물 설정</h1>
      <p className="mb-6 text-sm text-black/60 dark:text-white/60">
        이 정보는 이 브라우저에만 저장되며 서버로 전송되지 않습니다.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-black/10 p-6 dark:border-white/10">
        <div>
          <label className="mb-1 block text-sm font-medium">견종</label>
          <input
            type="text"
            placeholder="예: 골든리트리버 (모르면 비워두세요)"
            value={form.breed}
            onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))}
            className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/15"
          />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isDangerousBreed}
            onChange={(e) => setForm((f) => ({ ...f, isDangerousBreed: e.target.checked }))}
            className="mt-0.5"
          />
          <span>
            맹견에 해당해요{" "}
            <span className="block text-xs text-black/50 dark:text-white/50">
              (도사견, 아메리칸 핏불테리어, 아메리칸 스태퍼드셔 테리어, 스태퍼드셔 불테리어, 로트와일러 등 맹견 지정견종)
            </span>
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.hasLeash}
            onChange={(e) => setForm((f) => ({ ...f, hasLeash: e.target.checked }))}
          />
          목줄을 소지하고 있어요
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.hasMuzzle}
            onChange={(e) => setForm((f) => ({ ...f, hasMuzzle: e.target.checked }))}
          />
          입마개를 소지하고 있어요
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            저장하기
          </button>
          {saved && <span className="text-sm text-emerald-700 dark:text-emerald-400">저장되었습니다 ✓</span>}
          <button
            type="button"
            onClick={() => {
              clearProfile();
              setForm(EMPTY);
            }}
            className="ml-auto text-sm text-black/40 underline hover:text-black/70 dark:text-white/40 dark:hover:text-white/70"
          >
            정보 초기화
          </button>
        </div>
      </form>

      <button
        type="button"
        onClick={() => router.push("/facilities")}
        className="mt-6 text-sm text-emerald-700 underline dark:text-emerald-400"
      >
        시설 목록으로 이동 →
      </button>
    </div>
  );
}
