# 02. 기술 설계서 — PawCheck

## 1. 전체 아키텍처

```
[한국관광공사 KorPetTourService2]
        │  (petTourSyncList2 / detailPetTour2)
        ▼
[동기화 스크립트 scripts/sync.ts] ── 규칙기반 파서 ──┐
        │                                            │
        ▼                                            ▼
   [SQLite DB (Prisma)]  ◄── LLM 파서(Claude, etcAcmpyInfo 전용) ──┘
        │
        ▼
[Next.js Route Handlers (/api/*)]
        │
        ▼
[Next.js App Router 페이지 / React 컴포넌트]
        │
        ▼
        사용자
```

핵심 설계 원칙: **API 호출은 동기화 스크립트에서만 발생**하고, 사용자가 앱을 쓰는 동안에는
DB만 조회한다. 이렇게 해야 일 1,000건 트래픽 제한 안에서 다수 사용자를 감당할 수 있다.

## 2. 기술 스택 상세

- **Next.js 14 (App Router, TypeScript)**: 프론트+백엔드(Route Handler) 통합
- **TailwindCSS**: 스타일링. 커스텀 디자인 토큰은 `04-screens.md` 참고
- **Prisma + SQLite**: 로컬 파일 기반 DB. 별도 DB 서버 설치 없이 `npx prisma migrate dev`로 즉시 구동
- **Anthropic SDK (`@anthropic-ai/sdk`)**: `etcAcmpyInfo` 예외조항 파싱 전용, model은
  `claude-sonnet-4-6` 고정 사용, 응답은 반드시 JSON only로 받아 파싱
- **닉네임 기반 익명 세션**: 로그인 없이 브라우저 localStorage에 닉네임 저장 → 후기 작성 시 사용

## 3. 데이터 파이프라인

### 3-1. 동기화 스크립트 (`scripts/sync.ts`)

CLI로 실행 가능한 스크립트. `npm run sync -- --type=12,28`처럼 콘텐츠타입을 인자로 받는다.

처리 순서:
1. `petTourSyncList2`로 콘텐츠타입별 목록(`contentid`, `title`, `addr1`, `mapx`, `mapy`,
   `firstimage`, `modifiedtime` 등) 페이지네이션 조회 → `Facility` 테이블에 upsert
2. 이미 `Facility.rawParsedAt`이 있고 `modifiedtime`이 API 응답과 동일하면 스킵(캐시 히트)
3. 신규/변경된 콘텐츠만 `detailPetTour2` 호출 → 원문 필드 저장
   (`acmpyTypeCd`, `acmpyPsblCpam`, `acmpyNeedMtr`, `etcAcmpyInfo`, `relaPosesFclty`,
   `relaFrnshPrdlst`, `relaPurcPrdlst`, `relaRntlPrdlst`)
   **`relaAcdntRiskMtr`는 저장하되 UI에는 절대 노출하지 않음** (03-data-spec.md 참고,
   `acmpyPsblCpam`과 값이 중복 오염된 것으로 확인됨)
4. 규칙기반 파서(`lib/parser/ruleBasedParser.ts`)로 3개 필드를 구조화 → `PetPolicy` 테이블에 저장
5. `etcAcmpyInfo`가 비어있지 않으면 LLM 파서(`lib/parser/llmParser.ts`) 1회 호출 →
   예외조항 배열을 `PetPolicy.exceptions`(JSON 컬럼)에 저장. **이미 파싱된 적 있고 원문이
   바뀌지 않았으면 재호출하지 않음** (비용/쿼터 절약)

### 3-2. API 키 미설정 시 Mock 모드

`lib/tourApi/client.ts`에서 `process.env.TOUR_API_SERVICE_KEY`가 없으면
`docs/03-data-spec.md`에 있는 실측 샘플 5건을 그대로 반환하는 mock 클라이언트로 자동
전환한다. 이 덕분에 서비스키가 없어도 UI/파싱/DB 전체 흐름을 개발·테스트할 수 있다.

## 4. 규칙 기반 파서 로직 (`lib/parser/ruleBasedParser.ts`)

실측 데이터 패턴(03-data-spec.md)에 기반한 매핑 규칙:

```ts
type PetPolicyStructured = {
  indoorAllowed: "yes" | "no" | "partial" | "unknown";
  outdoorAllowed: "yes" | "no" | "unknown";
  breedRestriction: "none" | "dangerous_breed_conditional" | "unknown";
  muzzleRequired: boolean;
  leashRequired: boolean;
  needsManualCheck: boolean; // 패턴에 안 걸리면 true, 원문 그대로 노출
};

function parseAcmpyTypeCd(text: string) {
  if (text.includes("전구역")) return { indoorAllowed: "yes", outdoorAllowed: "yes" };
  if (text.includes("일부구역")) return { indoorAllowed: "partial", outdoorAllowed: "yes" };
  return { indoorAllowed: "unknown", outdoorAllowed: "unknown", needsManualCheck: true };
}

function parseAcmpyPsblCpam(text: string) {
  if (text.includes("전 견종") && !text.includes("맹견")) {
    return { breedRestriction: "none", muzzleRequired: false };
  }
  if (text.includes("맹견") && text.includes("입마개")) {
    return { breedRestriction: "dangerous_breed_conditional", muzzleRequired: true };
  }
  return { breedRestriction: "unknown", needsManualCheck: true };
}

function parseAcmpyNeedMtr(text: string) {
  return { leashRequired: text.includes("목줄") };
}
```

위 함수들의 결과를 병합해 `PetPolicyStructured`를 만든다. 패턴에 걸리지 않는 케이스는
`needsManualCheck: true`로 표시하고, 프론트에서는 "정보 확인 필요 — 원문: {raw text}"로
노출한다 (임의로 안전 쪽/위험 쪽으로 단정하지 않는다).

## 5. LLM 파서 로직 (`lib/parser/llmParser.ts`)

`etcAcmpyInfo` 원문(예: `"- 실내 미술관은 동반 불가- 맹견의 경우, 입마개 착용 필수- 배변봉투
지참 및 배변처리 필수"`)을 Claude API에 전달해 아래 JSON 스키마로만 응답받는다.

```
System prompt (요지):
"입력된 한국어 반려동물 동반 규정 텍스트에서, 시설 내 특정 구역/상황에 대한 예외조항만
추출하라. 일반적인 안전수칙(배변봉투 지참 등)은 exceptions에 포함하지 말고 generalNotes에
넣어라. 반드시 아래 JSON 스키마로만 응답하고 다른 텍스트는 출력하지 마라."

응답 스키마:
{
  "exceptions": [
    { "scope": "실내 미술관", "allowed": false, "note": "동반 불가" }
  ],
  "generalNotes": ["배변봉투 지참 및 배변처리 필수"]
}
```

- API 응답은 `JSON.parse` 전에 코드펜스(` ```json `) 제거 처리
- 파싱 실패 시 `exceptions: []`, `generalNotes: [원문 그대로]`로 폴백
- 결과는 `PetPolicy.exceptions`, `PetPolicy.generalNotes`에 저장하고 재사용

## 6. Prisma 스키마 (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Facility {
  id              String   @id            // contentid
  title           String
  contentTypeId   Int
  addr1           String?
  mapx            Float?
  mapy            Float?
  firstImage      String?
  modifiedTime    String?                 // API의 modifiedtime, 캐시 비교용
  rawAcmpyTypeCd     String?
  rawAcmpyPsblCpam   String?
  rawAcmpyNeedMtr    String?
  rawEtcAcmpyInfo    String?
  rawRelaPosesFclty  String?
  rawRelaFrnshPrdlst String?
  rawRelaPurcPrdlst  String?
  rawRelaRntlPrdlst  String?
  syncedAt        DateTime @default(now())
  policy          PetPolicy?
  reviews         Review[]
}

model PetPolicy {
  id                  String   @id @default(cuid())
  facilityId          String   @unique
  facility            Facility @relation(fields: [facilityId], references: [id])
  indoorAllowed       String   // yes | no | partial | unknown
  outdoorAllowed      String   // yes | no | unknown
  breedRestriction    String   // none | dangerous_breed_conditional | unknown
  muzzleRequired      Boolean
  leashRequired       Boolean
  needsManualCheck    Boolean
  exceptionsJson      String?  // LLM 파싱 결과, JSON string
  generalNotesJson    String?  // JSON string
  parsedAt            DateTime @default(now())
}

model Review {
  id           String   @id @default(cuid())
  facilityId   String
  facility     Facility @relation(fields: [facilityId], references: [id])
  nickname     String
  visitedOn    DateTime
  stillAccurate Boolean
  comment      String?
  createdAt    DateTime @default(now())
}
```

## 7. 신뢰도 지수 계산 로직

시설 상세 화면에 표시할 "정보 신뢰도"는 아래 규칙으로 계산한다 (단순 규칙, 과도한
알고리즘화 지양):

```
최근 90일 이내 리뷰만 집계
score = (stillAccurate=true 리뷰 수) / (전체 리뷰 수)
표시:
  리뷰 0건       → "검증된 후기 없음 (API 원문 기준)"
  리뷰 1~2건     → "최근 확인 {n}건"
  리뷰 3건 이상  → "신뢰도 {score*100}% ({n}건 기준)"
```

## 8. 개인화 판정 로직 (`lib/decision/evaluate.ts`)

사용자 입력(견종/맹견여부, 목줄 소지, 입마개 소지)과 `PetPolicy`를 비교해 판정:

```ts
function evaluate(pet: PetProfile, policy: PetPolicyStructured): "가능" | "조건부" | "확인필요" {
  if (policy.needsManualCheck) return "확인필요";
  if (policy.breedRestriction === "dangerous_breed_conditional" && pet.isDangerousBreed) {
    return pet.hasMuzzle ? "가능" : "조건부"; // 입마개 있으면 가능, 없으면 조건부(준비 필요) 안내
  }
  if (policy.leashRequired && !pet.hasLeash) return "조건부";
  return "가능";
}
```

이 결과값과 함께 **왜 그런 판정인지 사유 텍스트**를 반드시 같이 렌더링한다
(`04-screens.md`의 상세 화면 참고).

## 9. 콜드스타트(초기 리뷰 부재) 대응

- MVP 단계에서는 리뷰 0건이 정상이므로, UI 문구를 "검증 후기 없음"이 아니라
  "공사 API 등록 정보 기준(최신 확인 요망)"으로 자연스럽게 안내
- 시드 데이터를 넣고 싶다면 `prisma/seed.ts`에 팀이 직접 작성한 2~3건의 예시 리뷰를
  `nickname: "PawCheck 팀"`으로 명시적으로 표시해 실제 사용자 후기와 혼동되지 않게 한다

## 10. 트래픽/쿼터 관리

- `TOUR_API_SERVICE_KEY` 개발계정 기준 일 1,000건 제한
- 동기화 스크립트는 카테고리당 최대 N건으로 제한 인자를 받도록 구현하고,
  `--dry-run` 옵션으로 실제 호출 없이 캐시 상태만 점검할 수 있게 한다
- Anthropic API 호출은 `etcAcmpyInfo`가 있고 아직 파싱되지 않은 건에 한해서만 실행
