import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CONTENT_TYPE_LABEL, breedLabel, indoorLabel, outdoorLabel } from "@/lib/format";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const sp = await searchParams;
  const ids = (sp.ids ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const facilities = ids.length
    ? await prisma.facility.findMany({ where: { id: { in: ids } }, include: { policy: true } })
    : [];

  const ordered = ids.map((id) => facilities.find((f) => f.id === id)).filter((f): f is NonNullable<typeof f> => Boolean(f));

  const rows: { label: string; get: (f: (typeof ordered)[number]) => string }[] = [
    { label: "카테고리", get: (f) => CONTENT_TYPE_LABEL[f.contentTypeId] ?? String(f.contentTypeId) },
    { label: "주소", get: (f) => f.addr1 ?? "정보 없음" },
    { label: "실내 동반 가능", get: (f) => (f.policy ? indoorLabel(f.policy.indoorAllowed) : "확인필요") },
    { label: "실외 동반 가능", get: (f) => (f.policy ? outdoorLabel(f.policy.outdoorAllowed) : "확인필요") },
    { label: "맹견 제한", get: (f) => (f.policy ? breedLabel(f.policy.breedRestriction) : "확인필요") },
    { label: "목줄 착용 필수", get: (f) => (f.policy?.leashRequired ? "O" : "X") },
    { label: "입마개 필요(맹견 한정)", get: (f) => (f.policy?.muzzleRequired ? "O" : "X") },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold">규정 비교</h1>
      <p className="mb-6 text-sm text-black/60 dark:text-white/60">
        최대 3개 시설의 표준 체크리스트를 나란히 비교합니다.{" "}
        <Link href="/facilities" className="underline">
          시설 목록으로
        </Link>
      </p>

      {ordered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 p-10 text-center text-black/50 dark:border-white/15 dark:text-white/50">
          비교할 시설을 시설 목록에서 선택해주세요. (예: /facilities/compare?ids=FIXTURE_001,FIXTURE_002)
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-40 border-b border-black/10 p-3 text-left dark:border-white/10"> </th>
                {ordered.map((f) => (
                  <th key={f.id} className="border-b border-black/10 p-3 text-left dark:border-white/10">
                    <Link href={`/facilities/${f.id}`} className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
                      {f.title}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-black/5 dark:border-white/5">
                  <td className="p-3 font-medium text-black/60 dark:text-white/60">{row.label}</td>
                  {ordered.map((f) => (
                    <td key={f.id} className="p-3">
                      {row.get(f)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
