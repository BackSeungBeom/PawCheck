// backfillLlm 이후에도 "여전히 폴백"(exceptions=[]이고 generalNotes가 원문 그대로)으로
// 남은 PetPolicy를 원인별로 분류하고, 실제 실패로 보이는 건만 parseEtcAcmpyInfoDebug로
// 재호출해 실패 단계(API 에러/JSON 파싱 에러)를 확인한다. Tour API는 호출하지 않는다.
// 사용법: npx tsx scripts/investigateFallback.ts
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { parseEtcAcmpyInfoDebug } from "../lib/parser/llmParser";

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

async function main() {
  const facilities = await prisma.facility.findMany({
    where: { rawEtcAcmpyInfo: { not: null } },
    include: { policy: true },
  });

  const fallbackFacilities = facilities.filter(
    (f) =>
      f.rawEtcAcmpyInfo &&
      f.rawEtcAcmpyInfo.trim() &&
      f.policy &&
      isFallback(f.rawEtcAcmpyInfo, f.policy.exceptionsJson, f.policy.generalNotesJson)
  );

  console.log(`=== 여전히 폴백인 건 목록 (${fallbackFacilities.length}건) ===`);
  for (const f of fallbackFacilities) {
    console.log(`\n[${f.id}] ${f.title}`);
    console.log(`  rawEtcAcmpyInfo: ${f.rawEtcAcmpyInfo}`);
  }

  console.log(`\n\n=== 재호출로 원인 진단 및 재처리 시작 ===`);

  let genuineNoException = 0; // (a) 재파싱 성공 + 실제로 예외조항 없음 → 정상
  let recoveredSuccess = 0; // (b) 재파싱 성공 + exceptions 채워짐
  const stillFailing: { id: string; title: string; raw: string; reason: string }[] = []; // (c)

  for (const f of fallbackFacilities) {
    const raw = f.rawEtcAcmpyInfo!;
    const result = await parseEtcAcmpyInfoDebug(raw);

    if (result.status === "success") {
      await prisma.petPolicy.update({
        where: { facilityId: f.id },
        data: {
          exceptionsJson: JSON.stringify(result.exceptions),
          generalNotesJson: JSON.stringify(result.generalNotes),
          parsedAt: new Date(),
        },
      });
      if (result.exceptions.length > 0) {
        recoveredSuccess++;
        console.log(`  [(b) 재처리 성공] ${f.id} ${f.title} — exceptions=${result.exceptions.length}`);
      } else {
        genuineNoException++;
        console.log(`  [(a) 정상: 예외조항 없음 확인] ${f.id} ${f.title}`);
      }
      continue;
    }

    let reason: string;
    if (result.status === "api_error") {
      reason = `API 에러: ${result.message}`;
    } else if (result.status === "parse_error") {
      reason = `JSON 파싱 에러: ${result.message} / 모델 원본 응답: ${result.rawResponseText}`;
    } else if (result.status === "no_key") {
      reason = "ANTHROPIC_API_KEY 미설정";
    } else {
      reason = "rawEtcAcmpyInfo 비어있음 (예상치 못한 케이스)";
    }
    console.error(`  [(c) 재처리 실패] ${f.id} ${f.title} — ${reason}`);
    stillFailing.push({ id: f.id, title: f.title, raw, reason });
  }

  console.log("\n=== 최종 분류 요약 ===");
  console.log(`(a) 정상 (재파싱 성공, 실제로 예외조항 없음): ${genuineNoException}건`);
  console.log(`(b) 재처리 성공 (exceptions 채워짐): ${recoveredSuccess}건`);
  console.log(`(c) 재처리해도 실패: ${stillFailing.length}건`);
  if (stillFailing.length > 0) {
    console.log("\n--- (c) 상세 ---");
    for (const s of stillFailing) {
      console.log(`\n[${s.id}] ${s.title}`);
      console.log(`  원인: ${s.reason}`);
      console.log(`  원문: ${s.raw}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
