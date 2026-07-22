// 02-design.md §5 LLM 파서 로직 그대로 구현. etcAcmpyInfo 필드 전용.
import Anthropic from "@anthropic-ai/sdk";

export type PetPolicyException = {
  scope: string;
  allowed: boolean;
  note: string;
};

export type LlmParseResult = {
  exceptions: PetPolicyException[];
  generalNotes: string[];
};

const SYSTEM_PROMPT = `입력된 한국어 반려동물 동반 규정 텍스트에서, 시설 내 특정 구역/상황에 대한 예외조항만 추출하라. 일반적인 안전수칙(배변봉투 지참 등)은 exceptions에 포함하지 말고 generalNotes에 넣어라. 반드시 아래 JSON 스키마로만 응답하고 다른 텍스트는 출력하지 마라.

{
  "exceptions": [
    { "scope": "실내 미술관", "allowed": false, "note": "동반 불가" }
  ],
  "generalNotes": ["배변봉투 지참 및 배변처리 필수"]
}

설명 문장이나 분석 과정, 인사말을 앞뒤에 절대 덧붙이지 말고 JSON 객체 하나만 출력하라.`;

// 모델이 코드블록 앞뒤에 설명 문장을 덧붙여도 안전하게 파싱하도록, 첫 '{'부터 마지막 '}'까지만 추출한다.
function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return text.trim();
  return text.slice(start, end + 1);
}

export async function parseEtcAcmpyInfo(etcAcmpyInfo: string): Promise<LlmParseResult> {
  const fallback: LlmParseResult = { exceptions: [], generalNotes: [etcAcmpyInfo] };

  if (!etcAcmpyInfo.trim()) {
    return { exceptions: [], generalNotes: [] };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return fallback;
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: etcAcmpyInfo }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return fallback;

    const cleaned = extractJson(textBlock.text);
    const parsed = JSON.parse(cleaned);

    return {
      exceptions: Array.isArray(parsed.exceptions) ? parsed.exceptions : [],
      generalNotes: Array.isArray(parsed.generalNotes) ? parsed.generalNotes : [],
    };
  } catch (err) {
    console.error(
      `[llmParser] etcAcmpyInfo 파싱 실패, 폴백 처리: ${err instanceof Error ? err.message : String(err)}`
    );
    return fallback;
  }
}

// parseEtcAcmpyInfo와 달리 실패를 조용히 폴백으로 삼키지 않고 실패 단계/원인을 그대로 반환한다.
// 폴백으로 남은 건들의 실패 원인(API 에러 vs JSON 파싱 에러)을 진단할 때 사용.
export type LlmParseDebugResult =
  | { status: "empty" }
  | { status: "no_key" }
  | { status: "api_error"; message: string }
  | { status: "parse_error"; message: string; rawResponseText: string }
  | { status: "success"; exceptions: PetPolicyException[]; generalNotes: string[] };

export async function parseEtcAcmpyInfoDebug(etcAcmpyInfo: string): Promise<LlmParseDebugResult> {
  if (!etcAcmpyInfo.trim()) return { status: "empty" };
  if (!process.env.ANTHROPIC_API_KEY) return { status: "no_key" };

  let responseText: string;
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: etcAcmpyInfo }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { status: "api_error", message: "응답에 text 블록이 없음" };
    }
    responseText = textBlock.text;
  } catch (err) {
    return { status: "api_error", message: err instanceof Error ? err.message : String(err) };
  }

  const cleaned = extractJson(responseText);
  try {
    const parsed = JSON.parse(cleaned);
    return {
      status: "success",
      exceptions: Array.isArray(parsed.exceptions) ? parsed.exceptions : [],
      generalNotes: Array.isArray(parsed.generalNotes) ? parsed.generalNotes : [],
    };
  } catch (err) {
    return {
      status: "parse_error",
      message: err instanceof Error ? err.message : String(err),
      rawResponseText: cleaned,
    };
  }
}
