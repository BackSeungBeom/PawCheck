// 03-data-spec.md §6 실측 원문 샘플 — mock 모드(API 키 미설정 시) 기본 fixture
export type PetTourDetailFixture = {
  contentid: string;
  title: string;
  contenttypeid: number;
  acmpyTypeCd: string;
  acmpyPsblCpam: string;
  acmpyNeedMtr: string;
  etcAcmpyInfo: string;
  relaPosesFclty: string;
  relaFrnshPrdlst: string;
  relaPurcPrdlst: string;
  relaRntlPrdlst: string;
  relaAcdntRiskMtr?: string;
  addr1?: string;
  mapx?: number;
  mapy?: number;
  firstimage?: string;
  modifiedtime?: string;
};

export const FIXTURES: PetTourDetailFixture[] = [
  {
    contentid: "FIXTURE_001",
    title: "장수누리파크",
    contenttypeid: 12,
    acmpyTypeCd: "전구역 동반가능",
    acmpyPsblCpam: "전 견종 동반 가능",
    acmpyNeedMtr: "목줄 착용",
    etcAcmpyInfo:
      "- 맹견의 경우, 입마개 착용 필수- 배변봉투 지참 및 배변처리 필수",
    relaPosesFclty: "",
    relaFrnshPrdlst: "",
    relaPurcPrdlst: "",
    relaRntlPrdlst: "",
    relaAcdntRiskMtr: "전 견종 동반 가능",
    addr1: "전북특별자치도 장수군",
    mapx: 127.521,
    mapy: 35.6474,
    firstimage: "",
    modifiedtime: "20260601000000",
  },
  {
    contentid: "FIXTURE_002",
    title: "진도 운림산방",
    contenttypeid: 12,
    acmpyTypeCd: "일부구역 동반가능",
    acmpyPsblCpam: "전 견종 출입 가능(맹견의 경우, 입마개 착용 필수)",
    acmpyNeedMtr: "목줄 착용",
    etcAcmpyInfo:
      "- 실내 미술관은 동반 불가- 맹견의 경우, 입마개 착용 필수- 배변봉투 지참 및 배변처리 필수",
    relaPosesFclty: "",
    relaFrnshPrdlst: "",
    relaPurcPrdlst: "",
    relaRntlPrdlst: "",
    addr1: "전라남도 진도군",
    mapx: 126.284,
    mapy: 34.4685,
    firstimage: "",
    modifiedtime: "20260602000000",
  },
  {
    contentid: "FIXTURE_003",
    title: "바람새마을 소풍정원",
    contenttypeid: 12,
    acmpyTypeCd: "전구역 동반가능",
    acmpyPsblCpam: "전 견종 동반 가능",
    acmpyNeedMtr: "목줄 착용",
    etcAcmpyInfo:
      "- 캠핑장은 동반불가- 맹견의 경우, 입마개 착용 필수- 배변봉투 지참 및 배변처리 필수",
    relaPosesFclty: "",
    relaFrnshPrdlst: "",
    relaPurcPrdlst: "",
    relaRntlPrdlst: "",
    addr1: "전북특별자치도 장수군",
    mapx: 127.601,
    mapy: 35.6011,
    firstimage: "",
    modifiedtime: "20260603000000",
  },
  {
    contentid: "FIXTURE_004",
    title: "아우아우",
    contenttypeid: 28,
    acmpyTypeCd: "전구역 동반가능",
    acmpyPsblCpam: "전 견종 동반 가능",
    acmpyNeedMtr: "목줄 착용",
    etcAcmpyInfo: "- 배변봉투 지참 및 배변처리 필수",
    relaPosesFclty:
      "안전문, 울타리, 반려견 전용 UV 살균기, 사진공간, 반려견 전용 실내 공간, 화산송이 운동장, 야외 오두막",
    relaFrnshPrdlst: "매너벨트, 식기",
    relaPurcPrdlst: "간식, 장난감, 용품, 의류 등",
    relaRntlPrdlst: "",
    addr1: "제주특별자치도 제주시",
    mapx: 126.531,
    mapy: 33.4996,
    firstimage: "",
    modifiedtime: "20260604000000",
  },
  {
    contentid: "FIXTURE_005",
    title: "휘닉스 스노우파크",
    contenttypeid: 28,
    acmpyTypeCd: "일부구역 동반가능",
    acmpyPsblCpam: "전 견종 동반 가능",
    acmpyNeedMtr: "목줄 착용",
    etcAcmpyInfo: "- 실내 시설은 동반 불가- 배변봉투 지참 및 배변처리 필수",
    relaPosesFclty: "",
    relaFrnshPrdlst:
      "배변봉투, 식기 또는 물그릇, 목욕용품, 간식, 장난감 또는 놀이용품",
    relaPurcPrdlst: "없음",
    relaRntlPrdlst:
      "전용하우스, 쿠션, 계단, 배변판, 배변패드, 식기류, 욕조, 입마개, 놀이매트, 탈취제, 놀이터 기구",
    addr1: "강원특별자치도 평창군",
    mapx: 128.377,
    mapy: 37.5965,
    firstimage: "",
    modifiedtime: "20260605000000",
  },
];
