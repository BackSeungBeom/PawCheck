// 02-design.md §4 규칙 기반 파서 로직 그대로 구현.
// 패턴에 걸리지 않는 케이스는 needsManualCheck: true로 표시하고, 프론트에서는
// "정보 확인 필요 — 원문: {raw text}"로 노출한다 (임의로 안전/위험 쪽으로 단정하지 않는다).

export type PetPolicyStructured = {
  indoorAllowed: "yes" | "no" | "partial" | "unknown";
  outdoorAllowed: "yes" | "no" | "unknown";
  breedRestriction: "none" | "dangerous_breed_conditional" | "unknown";
  muzzleRequired: boolean;
  leashRequired: boolean;
  needsManualCheck: boolean;
};

function parseAcmpyTypeCd(text: string) {
  if (text.includes("전구역")) {
    return { indoorAllowed: "yes" as const, outdoorAllowed: "yes" as const };
  }
  if (text.includes("일부구역")) {
    return { indoorAllowed: "partial" as const, outdoorAllowed: "yes" as const };
  }
  return {
    indoorAllowed: "unknown" as const,
    outdoorAllowed: "unknown" as const,
    needsManualCheck: true,
  };
}

function parseAcmpyPsblCpam(text: string) {
  if (text.includes("전 견종") && !text.includes("맹견")) {
    return { breedRestriction: "none" as const, muzzleRequired: false };
  }
  if (text.includes("맹견") && text.includes("입마개")) {
    return { breedRestriction: "dangerous_breed_conditional" as const, muzzleRequired: true };
  }
  return { breedRestriction: "unknown" as const, muzzleRequired: false, needsManualCheck: true };
}

function parseAcmpyNeedMtr(text: string) {
  return { leashRequired: text.includes("목줄") };
}

export function parsePetPolicy(fields: {
  acmpyTypeCd: string;
  acmpyPsblCpam: string;
  acmpyNeedMtr: string;
}): PetPolicyStructured {
  const typeResult = parseAcmpyTypeCd(fields.acmpyTypeCd ?? "");
  const cpamResult = parseAcmpyPsblCpam(fields.acmpyPsblCpam ?? "");
  const needResult = parseAcmpyNeedMtr(fields.acmpyNeedMtr ?? "");

  return {
    indoorAllowed: typeResult.indoorAllowed,
    outdoorAllowed: typeResult.outdoorAllowed,
    breedRestriction: cpamResult.breedRestriction,
    muzzleRequired: cpamResult.muzzleRequired,
    leashRequired: needResult.leashRequired,
    needsManualCheck: Boolean(typeResult.needsManualCheck) || Boolean(cpamResult.needsManualCheck),
  };
}
