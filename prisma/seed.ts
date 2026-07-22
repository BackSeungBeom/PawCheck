// 02-design.md §9 콜드스타트 대응 시드 리뷰. 실제 사용자 후기와 혼동되지 않도록
// nickname에 "PawCheck 팀"을 명시적으로 표시한다.
import { prisma } from "../lib/prisma";

async function main() {
  const facilities = await prisma.facility.findMany({ take: 3, orderBy: { syncedAt: "asc" } });

  if (facilities.length === 0) {
    console.log("시드할 Facility가 없습니다. 먼저 npm run sync를 실행하세요.");
    return;
  }

  const seedReviews = [
    {
      facilityId: facilities[0].id,
      nickname: "PawCheck 팀",
      visitedOn: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      stillAccurate: true,
      comment: "팀이 직접 방문 확인한 결과, 공사 API 등록 규정과 동일했습니다.",
    },
    {
      facilityId: facilities[Math.min(1, facilities.length - 1)].id,
      nickname: "PawCheck 팀",
      visitedOn: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      stillAccurate: true,
      comment: "팀 방문조사 시드 데이터입니다. 실사용자 후기가 쌓이면 자연스럽게 비중이 줄어듭니다.",
    },
    {
      facilityId: facilities[Math.min(2, facilities.length - 1)].id,
      nickname: "PawCheck 팀",
      visitedOn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      stillAccurate: true,
      comment: "출입 규정을 현장에서 재확인했습니다.",
    },
  ];

  for (const review of seedReviews) {
    await prisma.review.create({ data: review });
  }

  console.log(`시드 리뷰 ${seedReviews.length}건 생성 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
