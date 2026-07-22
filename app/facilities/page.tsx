import { prisma } from "@/lib/prisma";
import { regionOf } from "@/lib/format";
import { FacilityCompareGrid } from "@/components/FacilityCompareGrid";

type SearchParams = {
  region?: string;
  contentType?: string;
  indoorOnly?: string;
  noBreedRestriction?: string;
  sort?: string;
};

export default async function FacilitiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const facilities = await prisma.facility.findMany({
    include: { policy: true, reviews: true },
    orderBy: { syncedAt: "desc" },
  });

  const allRegions = Array.from(new Set(facilities.map((f) => regionOf(f.addr1)))).sort();

  let filtered = facilities.filter((f) => f.contentTypeId === 12 || f.contentTypeId === 28);

  if (sp.region) filtered = filtered.filter((f) => regionOf(f.addr1) === sp.region);
  if (sp.contentType) filtered = filtered.filter((f) => String(f.contentTypeId) === sp.contentType);
  if (sp.indoorOnly === "1") filtered = filtered.filter((f) => f.policy?.indoorAllowed === "yes");
  if (sp.noBreedRestriction === "1") filtered = filtered.filter((f) => f.policy?.breedRestriction === "none");

  if (sp.sort === "trust") {
    filtered = [...filtered].sort((a, b) => b.reviews.length - a.reviews.length);
  } else {
    filtered = [...filtered].sort(
      (a, b) => (b.modifiedTime ?? "").localeCompare(a.modifiedTime ?? "")
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">시설 목록</h1>

      <form
        action="/facilities"
        method="get"
        className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-black/10 p-4 dark:border-white/10"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-black/60 dark:text-white/60">지역</label>
          <select
            name="region"
            defaultValue={sp.region ?? ""}
            className="rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm dark:border-white/15"
          >
            <option value="">전체 지역</option>
            {allRegions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-black/60 dark:text-white/60">카테고리</label>
          <select
            name="contentType"
            defaultValue={sp.contentType ?? ""}
            className="rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm dark:border-white/15"
          >
            <option value="">전체</option>
            <option value="12">관광지</option>
            <option value="28">레포츠</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="indoorOnly" value="1" defaultChecked={sp.indoorOnly === "1"} />
          실내 가능만 보기
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="noBreedRestriction"
            value="1"
            defaultChecked={sp.noBreedRestriction === "1"}
          />
          맹견 제한 없음만 보기
        </label>
        <div>
          <label className="mb-1 block text-xs font-medium text-black/60 dark:text-white/60">정렬</label>
          <select
            name="sort"
            defaultValue={sp.sort ?? "recent"}
            className="rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm dark:border-white/15"
          >
            <option value="recent">최신 수정순</option>
            <option value="trust">신뢰도순</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-full bg-emerald-700 px-5 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          적용
        </button>
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 p-10 text-center text-black/50 dark:border-white/15 dark:text-white/50">
          조건에 맞는 시설이 아직 없어요 — 커뮤니티에 등록을 제안해보세요
        </div>
      ) : (
        <FacilityCompareGrid facilities={filtered} />
      )}
    </div>
  );
}
