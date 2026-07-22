import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { regionOf } from "@/lib/format";

export default async function Home() {
  const facilities = await prisma.facility.findMany({ select: { addr1: true } });
  const regions = Array.from(new Set(facilities.map((f) => regionOf(f.addr1)))).sort();

  return (
    <div className="flex flex-1 flex-col items-center">
      <section className="w-full bg-gradient-to-b from-emerald-50 to-[var(--background)] px-6 py-16 text-center dark:from-emerald-950">
        <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-snug sm:text-4xl">
          🐾 헛걸음 없는 반려동물 동반 여행,{" "}
          <span className="text-emerald-700 dark:text-emerald-400">PawCheck</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-black/60 dark:text-white/60">
          시설의 반려동물 출입 규정을 표준 체크리스트로 정리하고, 내 반려동물 조건에 맞춰
          입장 가능 여부를 출발 전에 확인하세요.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/pet-profile"
            className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            내 반려동물로 시작하기
          </Link>
        </div>
      </section>

      <section className="w-full max-w-2xl px-6 py-10">
        <h2 className="mb-4 text-lg font-semibold">시설 찾아보기</h2>
        <form action="/facilities" method="get" className="flex flex-col gap-4 rounded-xl border border-black/10 p-5 dark:border-white/10">
          <div>
            <label className="mb-1 block text-sm font-medium">지역</label>
            <select name="region" className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/15">
              <option value="">전체 지역</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">카테고리</label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-sm dark:border-white/15">
                <input type="radio" name="contentType" value="" defaultChecked /> 전체
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-sm dark:border-white/15">
                <input type="radio" name="contentType" value="12" /> 관광지
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-sm dark:border-white/15">
                <input type="radio" name="contentType" value="28" /> 레포츠
              </label>
              <span className="flex items-center gap-1 rounded-lg border border-dashed border-black/15 px-3 py-2 text-sm text-black/40 dark:border-white/15 dark:text-white/40">
                숙박 <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] dark:bg-gray-700">곧 추가됩니다</span>
              </span>
              <span className="flex items-center gap-1 rounded-lg border border-dashed border-black/15 px-3 py-2 text-sm text-black/40 dark:border-white/15 dark:text-white/40">
                음식점 <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] dark:bg-gray-700">곧 추가됩니다</span>
              </span>
            </div>
          </div>
          <button
            type="submit"
            className="mt-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            시설 검색
          </button>
        </form>
      </section>
    </div>
  );
}
