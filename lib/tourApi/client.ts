// 03-data-spec.md 기반 KorPetTourService2 클라이언트.
// TOUR_API_SERVICE_KEY가 없으면 fixtures.ts의 실측 샘플로 자동 전환되는 mock 모드로 동작한다.
import { FIXTURES, type PetTourDetailFixture } from "./fixtures";

const BASE_URL = "http://apis.data.go.kr/B551011/KorPetTourService2";
const MOBILE_APP = "PawCheck";

export type SyncListItem = {
  contentid: string;
  contenttypeid: number;
  title: string;
  addr1?: string;
  addr2?: string;
  mapx?: number;
  mapy?: number;
  firstimage?: string;
  firstimage2?: string;
  modifiedtime?: string;
  tel?: string;
};

export type PetTourDetail = {
  contentid: string;
  acmpyTypeCd: string;
  acmpyPsblCpam: string;
  acmpyNeedMtr: string;
  etcAcmpyInfo: string;
  relaPosesFclty: string;
  relaFrnshPrdlst: string;
  relaPurcPrdlst: string;
  relaRntlPrdlst: string;
  relaAcdntRiskMtr: string; // 저장은 하되 파싱/화면에서 사용 금지
};

export function isMockMode(): boolean {
  return !process.env.TOUR_API_SERVICE_KEY;
}

function toDetail(f: PetTourDetailFixture): PetTourDetail {
  return {
    contentid: f.contentid,
    acmpyTypeCd: f.acmpyTypeCd,
    acmpyPsblCpam: f.acmpyPsblCpam,
    acmpyNeedMtr: f.acmpyNeedMtr,
    etcAcmpyInfo: f.etcAcmpyInfo,
    relaPosesFclty: f.relaPosesFclty,
    relaFrnshPrdlst: f.relaFrnshPrdlst,
    relaPurcPrdlst: f.relaPurcPrdlst,
    relaRntlPrdlst: f.relaRntlPrdlst,
    relaAcdntRiskMtr: f.relaAcdntRiskMtr ?? "",
  };
}

function toSyncListItem(f: PetTourDetailFixture): SyncListItem {
  return {
    contentid: f.contentid,
    contenttypeid: f.contenttypeid,
    title: f.title,
    addr1: f.addr1,
    mapx: f.mapx,
    mapy: f.mapy,
    firstimage: f.firstimage,
    modifiedtime: f.modifiedtime,
  };
}

async function callApi<T>(path: string, params: Record<string, string | number>): Promise<T[]> {
  const serviceKey = process.env.TOUR_API_SERVICE_KEY!;
  const url = new URL(BASE_URL + path);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("MobileOS", "ETC");
  url.searchParams.set("MobileApp", MOBILE_APP);
  url.searchParams.set("_type", "json");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Tour API HTTP error: ${res.status}`);
  }
  const json = await res.json();
  const header = json?.response?.header;
  if (!header || header.resultCode !== "0000") {
    throw new Error(
      `Tour API error: ${header?.resultCode ?? "unknown"} ${header?.resultMsg ?? ""}`
    );
  }
  const item = json?.response?.body?.items?.item;
  if (item === "" || item === undefined || item === null) return [];
  return Array.isArray(item) ? item : [item];
}

export async function fetchPetTourSyncList(opts: {
  contentTypeId?: number;
  numOfRows?: number;
  pageNo?: number;
}): Promise<{ items: SyncListItem[]; totalCount: number }> {
  if (isMockMode()) {
    const items = FIXTURES.filter(
      (f) => !opts.contentTypeId || f.contenttypeid === opts.contentTypeId
    ).map(toSyncListItem);
    return { items, totalCount: items.length };
  }

  const params: Record<string, string | number> = {
    numOfRows: opts.numOfRows ?? 100,
    pageNo: opts.pageNo ?? 1,
    arrange: "C",
  };
  if (opts.contentTypeId) params.contentTypeId = opts.contentTypeId;

  const rawItems = await callApi<Record<string, unknown>>("/petTourSyncList2", params);
  // 공공데이터포털 응답은 숫자 필드도 문자열로 내려오는 경우가 있어 명시적으로 형변환한다.
  const items: SyncListItem[] = rawItems.map((raw) => ({
    contentid: String(raw.contentid),
    contenttypeid: Number(raw.contenttypeid),
    title: String(raw.title ?? ""),
    addr1: raw.addr1 ? String(raw.addr1) : undefined,
    addr2: raw.addr2 ? String(raw.addr2) : undefined,
    mapx: raw.mapx !== undefined && raw.mapx !== "" ? Number(raw.mapx) : undefined,
    mapy: raw.mapy !== undefined && raw.mapy !== "" ? Number(raw.mapy) : undefined,
    firstimage: raw.firstimage ? String(raw.firstimage) : undefined,
    firstimage2: raw.firstimage2 ? String(raw.firstimage2) : undefined,
    modifiedtime: raw.modifiedtime ? String(raw.modifiedtime) : undefined,
    tel: raw.tel ? String(raw.tel) : undefined,
  }));
  return { items, totalCount: items.length };
}

export async function fetchPetTourDetail(contentId: string): Promise<PetTourDetail | null> {
  if (isMockMode()) {
    const fixture = FIXTURES.find((f) => f.contentid === contentId);
    return fixture ? toDetail(fixture) : null;
  }

  const items = await callApi<PetTourDetail>("/detailPetTour2", { contentId });
  return items[0] ?? null;
}
