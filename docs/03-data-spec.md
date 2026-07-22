# 03. 데이터 명세서 — KorPetTourService2 실측 기반

이 문서는 한국관광공사 개방데이터 활용매뉴얼(반려동물동반여행) v4.1과 실제 API 호출
결과(172건 표본)를 바탕으로 작성됨. **추측하지 말고 이 문서의 필드명/샘플을 그대로
사용할 것.**

## 1. 엔드포인트

Base URL: `http://apis.data.go.kr/B551011/KorPetTourService2`

| 오퍼레이션 | 경로 | 용도 |
|---|---|---|
| 반려동물 동반여행 동기화목록조회 | `/petTourSyncList2` | 콘텐츠ID 목록(제목/주소/좌표/수정일 포함) |
| 반려동물 동반여행조회 | `/detailPetTour2` | 특정 콘텐츠의 반려동물 동반 상세정보 |

공통 필수 파라미터: `serviceKey`, `MobileOS`(ETC), `MobileApp`(임의 문자열),
`_type=json`, `numOfRows`, `pageNo`

## 2. `/petTourSyncList2` 요청/응답

### 요청 파라미터 (주요)
- `contentTypeId` (선택, 없으면 전체): 12=관광지, 14=문화시설, 15=행사/공연/축제,
  28=레포츠, 32=숙박, 38=쇼핑, 39=음식점
- `arrange`: C=수정일순 (권장 — 최근 변경 콘텐츠 우선 동기화)
- `lDongRegnCd` / `lDongSignguCd`: 법정동 코드로 지역 필터 (선택)

### 응답 필드 (프론트에서 바로 쓰는 것들)
| 필드 | 설명 |
|---|---|
| `contentid` | 콘텐츠ID (PK로 사용) |
| `contenttypeid` | 카테고리 |
| `title` | 시설명 |
| `addr1` / `addr2` | 주소 |
| `mapx` / `mapy` | 경도/위도 (WGS84) |
| `firstimage` / `firstimage2` | 대표이미지(원본/썸네일) |
| `modifiedtime` | 콘텐츠 수정일 — **캐시 무효화 판단 기준** |
| `tel` | 전화번호 |

### 실측 전체 등록건수 (2026-07 기준, 표본 조사 시점)
| 카테고리 | 전체 건수 |
|---|---|
| 관광지(12) | 839 |
| 문화시설(14) | 28 |
| 행사/공연/축제(15) | 3 |
| 레포츠(28) | 99 |
| 숙박(32) | 282 |
| 쇼핑(38) | 8,678 |
| 음식점(39) | 226 |

## 3. `/detailPetTour2` 요청/응답

### 요청 파라미터
- `contentId` (필수)

### 응답 필드 전체 목록

| 필드 | 설명 | 실사용 여부 |
|---|---|---|
| `acmpyTypeCd` | 동반유형코드 (구역 단위 허용 범위) | ✅ 규칙파싱 |
| `acmpyPsblCpam` | 동반가능동물(견종 제한) | ✅ 규칙파싱 |
| `acmpyNeedMtr` | 동반시 필요사항 (목줄 등) | ✅ 규칙파싱 |
| `etcAcmpyInfo` | 기타 동반정보 (예외조항 다수 포함) | ✅ LLM파싱 |
| `relaPosesFclty` | 관련 구비시설 | ✅ 부가정보로 그대로 노출 |
| `relaFrnshPrdlst` | 관련 비치품목 | ✅ 출발 전 체크리스트에 활용 |
| `relaPurcPrdlst` | 관련 구매품목 | ✅ 부가정보로 그대로 노출 |
| `relaRntlPrdlst` | 관련 렌탈품목 | ✅ 출발 전 체크리스트에 활용 |
| `relaAcdntRiskMtr` | 관련 사고대비사항 | ❌ **사용 금지** (아래 4번 참고) |

## 4. ⚠️ 알려진 데이터 이슈 — `relaAcdntRiskMtr`

실측 결과, `relaAcdntRiskMtr` 값이 `acmpyPsblCpam`과 **완전히 동일한 값**으로 채워져
있음이 여러 건에서 확인됨(아래 예시). API 응답 매핑 오류 또는 데이터 입력 오류로 추정됨.

```
장수누리파크:
  acmpyPsblCpam    = "전 견종 동반 가능"
  relaAcdntRiskMtr = "전 견종 동반 가능"   ← 동일 값, 의미상 맞지 않음
```

**따라서 이 필드는 DB에 원문 저장은 하되, 파싱/화면 노출에서 절대 사용하지 않는다.**
(설계서 CLAUDE.md에도 명시됨)

## 5. 실측 필드 채움 비율 (표본 172건, 카테고리 혼합)

| 필드 | 채움률 |
|---|---|
| `acmpyTypeCd` | 87.2% |
| `acmpyPsblCpam` | 61.0% |
| `acmpyNeedMtr` | 51.7% |
| `etcAcmpyInfo` | 54.1% |
| `relaAcdntRiskMtr` | 37.8% (사용 안 함) |
| `relaPosesFclty` | 9.3% |
| `relaFrnshPrdlst` | 5.2% |
| `relaPurcPrdlst` | 4.1% |
| `relaRntlPrdlst` | 1.7% |

카테고리별 세부 채움률 (핵심 3필드 기준):

| 카테고리 | acmpyTypeCd | acmpyPsblCpam | acmpyNeedMtr | etcAcmpyInfo |
|---|---|---|---|---|
| 관광지 | 96.7% | 93.3% | 93.3% | 100.0% |
| 문화시설 | 75.0% | 71.4% | 67.9% | 67.9% |
| 레포츠 | 93.3% | 73.3% | 80.0% | 86.7% |
| 숙박 | 73.3% | 80.0% | 30.0% | 26.7% |
| 음식점 | 66.7% | 36.7% | 30.0% | 33.3% |
| 쇼핑 | 100.0%* | 0.0% | 0.0% | 0.0% |

\* 쇼핑 카테고리는 `acmpyTypeCd`만 형식적으로 채워져 있고 나머지 필드가 전부 비어 있어
실질적으로 무의미함 → MVP에서 제외 (01-plan.md 참고)

## 6. 실측 원문 샘플 (파서/LLM 프롬프트 테스트용 fixture)

아래 5건은 실제 API 응답에서 가져온 값이며, mock 모드(API 키 미설정 시)의 기본 fixture로
그대로 사용할 것 (`lib/tourApi/fixtures.ts`).

```json
[
  {
    "contentid": "FIXTURE_001",
    "title": "장수누리파크",
    "contenttypeid": 12,
    "acmpyTypeCd": "전구역 동반가능",
    "acmpyPsblCpam": "전 견종 동반 가능",
    "acmpyNeedMtr": "목줄 착용",
    "etcAcmpyInfo": "- 맹견의 경우, 입마개 착용 필수- 배변봉투 지참 및 배변처리 필수",
    "relaPosesFclty": "",
    "relaFrnshPrdlst": "",
    "relaPurcPrdlst": "",
    "relaRntlPrdlst": ""
  },
  {
    "contentid": "FIXTURE_002",
    "title": "진도 운림산방",
    "contenttypeid": 12,
    "acmpyTypeCd": "일부구역 동반가능",
    "acmpyPsblCpam": "전 견종 출입 가능(맹견의 경우, 입마개 착용 필수)",
    "acmpyNeedMtr": "목줄 착용",
    "etcAcmpyInfo": "- 실내 미술관은 동반 불가- 맹견의 경우, 입마개 착용 필수- 배변봉투 지참 및 배변처리 필수",
    "relaPosesFclty": "",
    "relaFrnshPrdlst": "",
    "relaPurcPrdlst": "",
    "relaRntlPrdlst": ""
  },
  {
    "contentid": "FIXTURE_003",
    "title": "바람새마을 소풍정원",
    "contenttypeid": 12,
    "acmpyTypeCd": "전구역 동반가능",
    "acmpyPsblCpam": "전 견종 동반 가능",
    "acmpyNeedMtr": "목줄 착용",
    "etcAcmpyInfo": "- 캠핑장은 동반불가- 맹견의 경우, 입마개 착용 필수- 배변봉투 지참 및 배변처리 필수",
    "relaPosesFclty": "",
    "relaFrnshPrdlst": "",
    "relaPurcPrdlst": "",
    "relaRntlPrdlst": ""
  },
  {
    "contentid": "FIXTURE_004",
    "title": "아우아우",
    "contenttypeid": 28,
    "acmpyTypeCd": "전구역 동반가능",
    "acmpyPsblCpam": "전 견종 동반 가능",
    "acmpyNeedMtr": "목줄 착용",
    "etcAcmpyInfo": "- 배변봉투 지참 및 배변처리 필수",
    "relaPosesFclty": "안전문, 울타리, 반려견 전용 UV 살균기, 사진공간, 반려견 전용 실내 공간, 화산송이 운동장, 야외 오두막",
    "relaFrnshPrdlst": "매너벨트, 식기",
    "relaPurcPrdlst": "간식, 장난감, 용품, 의류 등",
    "relaRntlPrdlst": ""
  },
  {
    "contentid": "FIXTURE_005",
    "title": "휘닉스 스노우파크",
    "contenttypeid": 28,
    "acmpyTypeCd": "일부구역 동반가능",
    "acmpyPsblCpam": "전 견종 동반 가능",
    "acmpyNeedMtr": "목줄 착용",
    "etcAcmpyInfo": "- 실내 시설은 동반 불가- 배변봉투 지참 및 배변처리 필수",
    "relaPosesFclty": "",
    "relaFrnshPrdlst": "배변봉투, 식기 또는 물그릇, 목욕용품, 간식, 장난감 또는 놀이용품",
    "relaPurcPrdlst": "없음",
    "relaRntlPrdlst": "전용하우스, 쿠션, 계단, 배변판, 배변패드, 식기류, 욕조, 입마개, 놀이매트, 탈취제, 놀이터 기구"
  }
]
```

## 7. 원문 응답 JSON 구조 예시 (실제 API 호출 시)

```json
{
  "response": {
    "header": { "resultCode": "0000", "resultMsg": "OK" },
    "body": {
      "items": {
        "item": [ { "contentid": "1059479", "acmpyTypeCd": "전구역 동반가능", "...": "..." } ]
      },
      "numOfRows": 1,
      "pageNo": 1,
      "totalCount": 1
    }
  }
}
```

- 결과가 1건이면 `item`이 배열이 아니라 객체로 오는 경우가 있으므로, 파싱 시
  `Array.isArray(item) ? item : [item]` 방어 코드 필수
- `resultCode !== "0000"`이면 에러 처리 (인증키 오류, 트래픽 초과 등)

## 8. 개발계정 제약

- 일 1,000건 트래픽 제한
- 자동승인, 신청 후 약 10분 뒤 사용 가능
