import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CONTENT_TYPE_LABEL } from "@/lib/format";
import { PetPolicyChecklist } from "@/components/PetPolicyChecklist";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { PetJudgementCard } from "@/components/PetJudgementCard";
import { ReviewSection } from "@/components/ReviewForm";
import type { PetPolicyStructured } from "@/lib/parser/ruleBasedParser";

type Exception = { scope: string; allowed: boolean; note: string };

function splitItems(text: string | null): string[] {
  if (!text || text.trim() === "" || text.trim() === "없음") return [];
  return text
    .split(/[,、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const facility = await prisma.facility.findUnique({
    where: { id },
    include: {
      policy: true,
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!facility) notFound();

  const exceptions: Exception[] = facility.policy?.exceptionsJson
    ? JSON.parse(facility.policy.exceptionsJson)
    : [];
  const generalNotes: string[] = facility.policy?.generalNotesJson
    ? JSON.parse(facility.policy.generalNotesJson)
    : [];

  const provided = splitItems(facility.rawRelaFrnshPrdlst);
  const rentable = splitItems(facility.rawRelaRntlPrdlst);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {CONTENT_TYPE_LABEL[facility.contentTypeId] ?? facility.contentTypeId}
        </span>
        <TrustScoreBadge reviews={facility.reviews} />
      </div>
      <h1 className="mb-1 text-2xl font-bold">{facility.title}</h1>
      <p className="mb-6 text-black/50 dark:text-white/50">{facility.addr1 ?? "주소 정보 없음"}</p>

      {facility.policy ? (
        <PetJudgementCard policy={facility.policy as unknown as PetPolicyStructured} />
      ) : (
        <section className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-black/60 dark:text-white/60">규정 정보가 아직 파싱되지 않아 판정할 수 없습니다.</p>
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">표준 체크리스트</h2>
        {facility.policy ? (
          <PetPolicyChecklist
            policy={facility.policy}
            raw={{
              acmpyTypeCd: facility.rawAcmpyTypeCd,
              acmpyPsblCpam: facility.rawAcmpyPsblCpam,
              acmpyNeedMtr: facility.rawAcmpyNeedMtr,
            }}
            exceptionAreas={exceptions}
          />
        ) : (
          <p className="text-sm text-black/50 dark:text-white/50">규정 정보가 아직 파싱되지 않았습니다.</p>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">예외조항</h2>
        {exceptions.length > 0 ? (
          <ul className="space-y-2">
            {exceptions.map((ex, i) => (
              <li
                key={i}
                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
              >
                ⚠️ <span className="font-medium">{ex.scope}</span>은(는) {ex.allowed ? "동반 가능" : "동반 불가"} — {ex.note}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-black/50 dark:text-white/50">등록된 예외조항이 없습니다.</p>
        )}
        {generalNotes.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-black/60 dark:text-white/60">
            {generalNotes.map((n, i) => (
              <li key={i}>· {n}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">출발 전 준비물</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
            <p className="mb-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">챙겨올 필요 없어요 (시설 제공)</p>
            {provided.length > 0 ? (
              <ul className="text-sm">
                {provided.map((p) => (
                  <li key={p}>· {p}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-black/40 dark:text-white/40">정보 없음</p>
            )}
          </div>
          <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
            <p className="mb-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">여기서 빌릴 수 있어요</p>
            {rentable.length > 0 ? (
              <ul className="text-sm">
                {rentable.map((p) => (
                  <li key={p}>· {p}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-black/40 dark:text-white/40">정보 없음</p>
            )}
          </div>
          <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
            <p className="mb-1 text-xs font-medium text-black/60 dark:text-white/60">직접 챙기세요</p>
            <p className="text-sm text-black/40 dark:text-white/40">
              위 목록에 없는 용품(목줄, 배변봉투 등)은 직접 준비해주세요.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">최근 방문자 후기</h2>
        <ReviewSection facilityId={facility.id} reviews={facility.reviews} />
      </section>
    </div>
  );
}
