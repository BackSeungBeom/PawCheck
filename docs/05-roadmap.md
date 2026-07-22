# 05. 개발 로드맵 — PawCheck

Claude Code는 아래 Phase를 순서대로 진행한다. 각 Phase 끝의 "완료 조건(DoD)"을
스스로 점검한 뒤 다음 Phase로 넘어갈 것. 중간에 막히면 앞 문서(01~04)를 다시 확인.

## Phase 0 — 프로젝트 초기화

- [ ] `npx create-next-app@latest` (TypeScript, TailwindCSS, App Router 옵션으로) 실행
- [ ] Prisma 설치 및 SQLite 초기화 (`prisma/schema.prisma`는 02-design.md §6 그대로)
- [ ] `@anthropic-ai/sdk` 설치
- [ ] `.env.example` 생성 (CLAUDE.md 참고), `.gitignore`에 `.env`, `dev.db` 추가
- [ ] `lib/tourApi/fixtures.ts`에 03-data-spec.md §6의 fixture 5건 그대로 입력

**DoD**: `npm run dev`로 빈 Next.js 앱이 뜨고, `npx prisma studio`로 빈 DB 테이블 구조가 보임

## Phase 1 — 데이터 파이프라인

- [ ] `lib/tourApi/client.ts`: 실 API 클라이언트 + mock 모드 자동 전환 (02-design.md §3-2)
- [ ] `lib/parser/ruleBasedParser.ts`: 02-design.md §4 로직 그대로 구현
- [ ] `lib/parser/llmParser.ts`: 02-design.md §5 로직 그대로 구현 (Claude API, JSON only 응답)
- [ ] `scripts/sync.ts`: 02-design.md §3-1 동기화 스크립트, `npm run sync -- --type=12,28` 로 실행 가능
- [ ] mock 모드로 `npm run sync`를 실행해 fixture 5건이 `Facility`/`PetPolicy` 테이블에
      정상 저장되는지 확인

**DoD**: mock 모드에서 동기화 스크립트 실행 후 `PetPolicy` 테이블에 5건이 규칙파싱+LLM파싱
결과와 함께 저장되어 있음 (Prisma Studio로 확인)

## Phase 2 — 핵심 화면 (조회 중심)

- [ ] `/facilities` 목록 화면 (04-screens.md §4-2)
- [ ] `/facilities/[id]` 상세 화면 — 체크리스트/예외조항/준비물까지 (판정 카드는 Phase 3에서)
- [ ] 공통 컴포넌트(`PolicyBadge`, `PetPolicyChecklist`) 구현

**DoD**: mock 데이터 5건이 목록/상세 화면에 정상 렌더링되고, "원문 보기" 토글로 API 원문
텍스트도 확인 가능

## Phase 3 — 개인화 판정 + 반려동물 프로필

- [ ] `/pet-profile` 화면 + localStorage 저장/조회 훅 (`hooks/usePetProfile.ts`)
- [ ] `lib/decision/evaluate.ts`: 02-design.md §8 로직 구현
- [ ] 시설 상세 화면에 "내 반려동물 기준 판정 카드" 연동

**DoD**: 반려동물 프로필을 다르게 설정했을 때(맹견 O/X, 입마개 O/X) 같은 시설에서 판정
결과가 실제로 달라짐을 확인

## Phase 4 — 커뮤니티 검증 + 신뢰도 지수

- [ ] `Review` 모델 CRUD Route Handler (`/api/reviews`)
- [ ] 시설 상세 화면의 리뷰 목록 + 작성 모달
- [ ] 신뢰도 지수 계산 로직(02-design.md §7) + `TrustScoreBadge` 컴포넌트
- [ ] `prisma/seed.ts`: 콜드스타트 대응용 팀 작성 시드 리뷰 2~3건 (닉네임에 "PawCheck 팀" 명시)

**DoD**: 리뷰 작성 시 즉시 목록/신뢰도 지수에 반영, 새로고침 없이도 상태 업데이트

## Phase 5 — 비교 화면 + 실 API 연동 + 마무리

- [ ] `/facilities/compare` 화면 (04-screens.md §4-4)
- [ ] 실제 `TOUR_API_SERVICE_KEY`가 `.env`에 설정된 경우 mock 대신 실 API로 동기화 재실행
      (`npm run sync -- --type=12,28 --limit=50` 정도로 소량 테스트 후 전체 실행)
- [ ] 반응형 점검 (모바일 뷰포트에서 카드/체크리스트 레이아웃 깨짐 없는지)
- [ ] README.md 작성: 실행 방법, 환경변수 설정법, 데이터 출처(공사 OpenAPI) 명시
      (공모전 제출 시 참고자료로도 활용 가능)

**DoD**: `npm run dev` 후 홈 → 목록 → 상세 → 리뷰작성 → 비교까지 전체 플로우가
에러 없이 동작하며, 실 서비스키 연동 시 실제 API 데이터로도 동일하게 동작함

## 참고 — 확장 아이디어 (MVP 이후, 시간 남을 때만)

- 숙박(32)/음식점(39) 카테고리 확장 (파이프라인은 이미 카테고리 무관 구조라 파라미터만 추가)
- 지도 임베드(카카오맵/네이버맵) 연동으로 좌표 기반 시각화
- 시설 규정 변경 알림(수정일 기준 diff 감지) 기능
