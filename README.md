# PawCheck

반려동물 동반 시설의 출입 규정(한국관광공사 OpenAPI 원문)을 구조화된 체크리스트로 변환하고,
사용자의 반려동물 조건에 맞춰 "입장 가능 여부"를 사전에 예측해 헛걸음을 줄이는 웹 서비스입니다.

2026 관광데이터 활용 공모전 ②-2 웹·앱 구현 부문 지정과제 6번 대응 프로젝트입니다.

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- TailwindCSS v4
- Prisma 5 + SQLite (로컬 파일 DB, 별도 서버 설치 불필요)
- Anthropic API (`@anthropic-ai/sdk`) — `etcAcmpyInfo` 필드 예외조항 파싱 전용
- 한국관광공사 OpenAPI `KorPetTourService2`

## 실행 방법

### 1. 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env`에 다음 값을 채웁니다.

```
TOUR_API_SERVICE_KEY=   # 공공데이터포털에서 발급받은 KorPetTourService2 서비스키 (Decoding 값)
ANTHROPIC_API_KEY=      # etcAcmpyInfo 예외조항 파싱용 (선택)
```

두 값 모두 **비워두어도 앱은 정상 동작**합니다.

- `TOUR_API_SERVICE_KEY`가 없으면 `docs/03-data-spec.md`의 실측 샘플 응답(fixture)으로 자동 전환되어 동작합니다.
- `ANTHROPIC_API_KEY`가 없으면 LLM 파싱 대신 원문을 그대로 노출하는 기본 폴백으로 동작합니다.

### 3. DB 준비

```bash
npx prisma migrate dev
```

### 4. 데이터 동기화 (시설 목록 + 상세 규정 수집 → DB 캐싱)

```bash
npm run sync -- --type=12,28
# 개발용으로 소량만 받고 싶다면:
npm run sync -- --type=12 --limit=5
```

- `--type`: 관광타입 콘텐츠ID (12=관광지, 28=레포츠)
- 이미 저장된 콘텐츠는 원본의 `modifiedtime`을 비교해 변경분만 다시 파싱합니다(불필요한 API 호출 방지).
- 일 1,000건 API 트래픽 제한이 있으므로 대량 동기화 시 `--limit`으로 조절하세요.

### 5. (선택) 샘플 리뷰 시드

```bash
npm run seed
```

### 6. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속 후 홈 → 시설 목록 → 상세 → 리뷰 작성 → 비교 순으로 확인할 수 있습니다.

## 데이터 출처

본 서비스의 시설 및 반려동물 동반 규정 데이터는 **한국관광공사 반려동물 동반여행 정보 서비스
(`KorPetTourService2`, 공공데이터포털 제공)** 원문을 기반으로 합니다. 앱 내 규정 요약/체크리스트는
공사 API 원문을 자동 파싱한 결과이며, 실제 방문 전에는 반드시 시설에 직접 규정을 확인하시기
바랍니다.

## 알아두어야 할 점

- `relaAcdntRiskMtr` 필드는 실측 결과 `acmpyPsblCpam`과 값이 중복/오염되어 있음이 확인되어, DB에는
  저장하되 파싱·화면 노출에는 사용하지 않습니다.
- LLM 파싱은 `etcAcmpyInfo`(예외조항 자유서술) 필드에 한정되며, 나머지 필드는 규칙 기반 파서로
  처리합니다.
- 로그인/인증 기능은 없으며, 리뷰는 닉네임 기반 익명 후기로 최소 범위로 제공됩니다.
