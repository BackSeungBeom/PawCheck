// 02-design.md §3-1 동기화 스크립트. 사용법: npm run sync -- --type=12,28 [--limit=50] [--dry-run]
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { fetchPetTourSyncList, fetchPetTourDetail, isMockMode } from "../lib/tourApi/client";
import { parsePetPolicy } from "../lib/parser/ruleBasedParser";
import { parseEtcAcmpyInfo } from "../lib/parser/llmParser";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: { types: number[]; limit?: number; dryRun: boolean } = {
    types: [12, 28],
    dryRun: false,
  };
  for (const arg of args) {
    if (arg.startsWith("--type=")) {
      opts.types = arg
        .slice("--type=".length)
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));
    } else if (arg.startsWith("--limit=")) {
      opts.limit = parseInt(arg.slice("--limit=".length), 10);
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
    }
  }
  return opts;
}

type SyncStats = {
  created: number;
  updated: number;
  skipped: number;
  detailFetched: number;
  ruleOnly: number;
  llmPathAttempted: number;
  errors: { contentid: string; title: string; message: string }[];
};

async function fetchAllItems(contentTypeId: number, limit: number | undefined) {
  if (limit) {
    const { items } = await fetchPetTourSyncList({ contentTypeId, numOfRows: limit });
    return items.slice(0, limit);
  }

  const numOfRows = 100;
  const all: Awaited<ReturnType<typeof fetchPetTourSyncList>>["items"] = [];
  let pageNo = 1;
  while (true) {
    const { items } = await fetchPetTourSyncList({ contentTypeId, numOfRows, pageNo });
    all.push(...items);
    if (items.length < numOfRows) break;
    pageNo++;
  }
  return all;
}

async function syncContentType(
  contentTypeId: number,
  limit: number | undefined,
  dryRun: boolean
): Promise<SyncStats> {
  console.log(`\n[contentTypeId=${contentTypeId}] 목록 조회 중...`);
  const targetItems = await fetchAllItems(contentTypeId, limit);
  console.log(`  -> ${targetItems.length}건 조회됨`);

  const stats: SyncStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    detailFetched: 0,
    ruleOnly: 0,
    llmPathAttempted: 0,
    errors: [],
  };

  for (const item of targetItems) {
    try {
      const existing = await prisma.facility.findUnique({ where: { id: item.contentid } });

      if (existing && existing.modifiedTime === (item.modifiedtime ?? null)) {
        stats.skipped++;
        continue;
      }

      if (dryRun) {
        console.log(`  [dry-run] ${item.contentid} ${item.title} — 캐시 미스, 상세조회 필요`);
        continue;
      }

      const detail = await fetchPetTourDetail(item.contentid);
      stats.detailFetched++;

      const facility = await prisma.facility.upsert({
        where: { id: item.contentid },
        create: {
          id: item.contentid,
          title: item.title,
          contentTypeId: item.contenttypeid,
          addr1: item.addr1 ?? null,
          mapx: item.mapx ?? null,
          mapy: item.mapy ?? null,
          firstImage: item.firstimage ?? null,
          modifiedTime: item.modifiedtime ?? null,
          rawAcmpyTypeCd: detail?.acmpyTypeCd ?? null,
          rawAcmpyPsblCpam: detail?.acmpyPsblCpam ?? null,
          rawAcmpyNeedMtr: detail?.acmpyNeedMtr ?? null,
          rawEtcAcmpyInfo: detail?.etcAcmpyInfo ?? null,
          rawRelaPosesFclty: detail?.relaPosesFclty ?? null,
          rawRelaFrnshPrdlst: detail?.relaFrnshPrdlst ?? null,
          rawRelaPurcPrdlst: detail?.relaPurcPrdlst ?? null,
          rawRelaRntlPrdlst: detail?.relaRntlPrdlst ?? null,
          rawRelaAcdntRiskMtr: detail?.relaAcdntRiskMtr ?? null,
        },
        update: {
          title: item.title,
          addr1: item.addr1 ?? null,
          mapx: item.mapx ?? null,
          mapy: item.mapy ?? null,
          firstImage: item.firstimage ?? null,
          modifiedTime: item.modifiedtime ?? null,
          rawAcmpyTypeCd: detail?.acmpyTypeCd ?? null,
          rawAcmpyPsblCpam: detail?.acmpyPsblCpam ?? null,
          rawAcmpyNeedMtr: detail?.acmpyNeedMtr ?? null,
          rawEtcAcmpyInfo: detail?.etcAcmpyInfo ?? null,
          rawRelaPosesFclty: detail?.relaPosesFclty ?? null,
          rawRelaFrnshPrdlst: detail?.relaFrnshPrdlst ?? null,
          rawRelaPurcPrdlst: detail?.relaPurcPrdlst ?? null,
          rawRelaRntlPrdlst: detail?.relaRntlPrdlst ?? null,
          rawRelaAcdntRiskMtr: detail?.relaAcdntRiskMtr ?? null,
        },
      });
      if (existing) {
        stats.updated++;
      } else {
        stats.created++;
      }

      if (!detail) continue;

      const existingPolicy = await prisma.petPolicy.findUnique({ where: { facilityId: facility.id } });

      const structured = parsePetPolicy({
        acmpyTypeCd: detail.acmpyTypeCd ?? "",
        acmpyPsblCpam: detail.acmpyPsblCpam ?? "",
        acmpyNeedMtr: detail.acmpyNeedMtr ?? "",
      });

      let exceptionsJson = existingPolicy?.exceptionsJson ?? null;
      let generalNotesJson = existingPolicy?.generalNotesJson ?? null;

      const etcInfoChanged = existing?.rawEtcAcmpyInfo !== detail.etcAcmpyInfo;
      if (detail.etcAcmpyInfo && (etcInfoChanged || !existingPolicy)) {
        const llmResult = await parseEtcAcmpyInfo(detail.etcAcmpyInfo);
        exceptionsJson = JSON.stringify(llmResult.exceptions);
        generalNotesJson = JSON.stringify(llmResult.generalNotes);
        stats.llmPathAttempted++;
      } else {
        stats.ruleOnly++;
      }

      await prisma.petPolicy.upsert({
        where: { facilityId: facility.id },
        create: {
          facilityId: facility.id,
          indoorAllowed: structured.indoorAllowed,
          outdoorAllowed: structured.outdoorAllowed,
          breedRestriction: structured.breedRestriction,
          muzzleRequired: structured.muzzleRequired,
          leashRequired: structured.leashRequired,
          needsManualCheck: structured.needsManualCheck,
          exceptionsJson,
          generalNotesJson,
        },
        update: {
          indoorAllowed: structured.indoorAllowed,
          outdoorAllowed: structured.outdoorAllowed,
          breedRestriction: structured.breedRestriction,
          muzzleRequired: structured.muzzleRequired,
          leashRequired: structured.leashRequired,
          needsManualCheck: structured.needsManualCheck,
          exceptionsJson,
          generalNotesJson,
          parsedAt: new Date(),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] ${item.contentid} ${item.title} — ${message}`);
      stats.errors.push({ contentid: item.contentid, title: item.title, message });
    }
  }

  console.log(
    `  -> 신규=${stats.created} 업데이트=${stats.updated} skipped(cache hit)=${stats.skipped} detail조회=${stats.detailFetched} 규칙파서만=${stats.ruleOnly} LLM경로=${stats.llmPathAttempted} 에러=${stats.errors.length}`
  );
  return stats;
}

async function main() {
  const opts = parseArgs();
  console.log(`동기화 시작 (mock=${isMockMode()}) types=${opts.types.join(",")} limit=${opts.limit ?? "전체"} dryRun=${opts.dryRun}`);

  const allStats: SyncStats[] = [];
  for (const contentTypeId of opts.types) {
    try {
      const stats = await syncContentType(contentTypeId, opts.limit, opts.dryRun);
      allStats.push(stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] contentTypeId=${contentTypeId} 목록 조회 자체가 실패함 — ${message}`);
      allStats.push({
        created: 0,
        updated: 0,
        skipped: 0,
        detailFetched: 0,
        ruleOnly: 0,
        llmPathAttempted: 0,
        errors: [{ contentid: "-", title: `contentTypeId=${contentTypeId} 목록조회`, message }],
      });
    }
  }

  const total = allStats.reduce(
    (acc, s) => ({
      created: acc.created + s.created,
      updated: acc.updated + s.updated,
      skipped: acc.skipped + s.skipped,
      detailFetched: acc.detailFetched + s.detailFetched,
      ruleOnly: acc.ruleOnly + s.ruleOnly,
      llmPathAttempted: acc.llmPathAttempted + s.llmPathAttempted,
      errors: [...acc.errors, ...s.errors],
    }),
    { created: 0, updated: 0, skipped: 0, detailFetched: 0, ruleOnly: 0, llmPathAttempted: 0, errors: [] as SyncStats["errors"] }
  );

  console.log("\n=== 동기화 최종 요약 ===");
  console.log(`신규 upsert: ${total.created}건, 업데이트 upsert: ${total.updated}건 (총 upsert=${total.created + total.updated}건), 스킵(cache hit): ${total.skipped}건`);
  console.log(`규칙파서만 적용: ${total.ruleOnly}건, LLM파싱 경로 진입: ${total.llmPathAttempted}건${process.env.ANTHROPIC_API_KEY ? "" : " (ANTHROPIC_API_KEY 미설정 — 전부 폴백 처리됨, 실제 LLM 호출 없음)"}`);
  console.log(`에러: ${total.errors.length}건`);
  if (total.errors.length > 0) {
    for (const e of total.errors) {
      console.log(`  - ${e.contentid} ${e.title}: ${e.message}`);
    }
  }
  console.log("\n동기화 완료");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
