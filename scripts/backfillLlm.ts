// DB에 이미 저장된 rawEtcAcmpyInfo 중, LLM 파싱이 안 되고 폴백 처리된(exceptions=[]이고
// generalNotes에 원문 그대로 들어간) PetPolicy만 골라 llmParser로 재처리한다.
// Tour API는 절대 호출하지 않는다 — DB에 저장된 rawEtcAcmpyInfo만 사용.
// 사용법: npm run backfill-llm (또는 npx tsx scripts/backfillLlm.ts)
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { parseEtcAcmpyInfo } from "../lib/parser/llmParser";

const TRIAL_SIZE = 10;

function isFallback(rawEtcAcmpyInfo: string, exceptionsJson: string | null, generalNotesJson: string | null) {
  if (exceptionsJson !== "[]") return false;
  if (!generalNotesJson) return false;
  try {
    const notes = JSON.parse(generalNotesJson);
    return Array.isArray(notes) && notes.length === 1 && notes[0] === rawEtcAcmpyInfo;
  } catch {
    return false;
  }
}

async function loadTargets() {
  const facilities = await prisma.facility.findMany({
    where: { rawEtcAcmpyInfo: { not: null } },
    include: { policy: true },
  });

  return facilities.filter(
    (f) =>
      f.rawEtcAcmpyInfo &&
      f.rawEtcAcmpyInfo.trim() &&
      f.policy &&
      isFallback(f.rawEtcAcmpyInfo, f.policy.exceptionsJson, f.policy.generalNotesJson)
  );
}

async function processOne(facility: { id: string; rawEtcAcmpyInfo: string | null }) {
  const raw = facility.rawEtcAcmpyInfo!;
  const result = await parseEtcAcmpyInfo(raw);
  await prisma.petPolicy.update({
    where: { facilityId: facility.id },
    data: {
      exceptionsJson: JSON.stringify(result.exceptions),
      generalNotesJson: JSON.stringify(result.generalNotes),
      parsedAt: new Date(),
    },
  });
  return result;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY가 설정되어 있지 않습니다. .env를 확인하세요.");
    process.exit(1);
  }

  const targets = await loadTargets();
  console.log(`처리 대상: ${targets.length}건 (예상 Anthropic API 호출: ${targets.length}회)`);

  if (targets.length === 0) {
    console.log("처리할 대상이 없습니다.");
    await prisma.$disconnect();
    return;
  }

  let filled = 0;
  let stillFallback = 0;
  const errors: { id: string; title: string; message: string }[] = [];

  for (let i = 0; i < targets.length; i++) {
    const f = targets[i];
    try {
      const result = await processOne(f);
      const sf =
        result.exceptions.length === 0 &&
        result.generalNotes.length === 1 &&
        result.generalNotes[0] === f.rawEtcAcmpyInfo;
      if (sf) stillFallback++;
      else filled++;
      console.log(
        `  [${i + 1}/${targets.length}] ${f.id} ${f.title} — exceptions=${result.exceptions.length}${sf ? " (폴백)" : ""}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  [${i + 1}/${targets.length}] [ERROR] ${f.id} ${f.title} — ${message}`);
      errors.push({ id: f.id, title: f.title, message });
    }

    if (i === TRIAL_SIZE - 1) {
      console.log(
        `\n=== 1차 시험 처리 완료 (${i + 1}건) — 변화있음=${filled} 여전히폴백=${stillFallback} 에러=${errors.length} ===`
      );
      if (filled === 0) {
        console.error("1차 시험에서 exceptions가 채워진 건이 하나도 없습니다 (API 키/응답 형식 문제 가능성). 나머지 처리를 중단합니다.");
        await prisma.$disconnect();
        process.exit(1);
      }
      if (targets.length > TRIAL_SIZE) {
        console.log(`정상 확인됨 — 나머지 ${targets.length - (i + 1)}건 이어서 처리합니다.\n`);
      }
    }
  }

  console.log("\n=== 백필 최종 요약 ===");
  console.log(`처리 대상: ${targets.length}건`);
  console.log(`exceptions 채워짐: ${filled}건`);
  console.log(`여전히 폴백(exceptions 없음): ${stillFallback}건`);
  console.log(`에러: ${errors.length}건`);
  for (const e of errors) console.log(`  - ${e.id} ${e.title}: ${e.message}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
