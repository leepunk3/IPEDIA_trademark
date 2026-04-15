// netlify/functions/review-trademark.ts

type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

type TrademarkReviewRequest = {
  markText?: string;
  trademark_name?: string;
  goodsServices?: string[] | string;
  goods_services?: string[] | string;
  classCodes?: string[] | string;
  class_codes?: string[] | string;
  channelName?: string;
  channel_name?: string;
  channelUrl?: string;
  channel_url?: string;
  interestType?: string;
  interest_type?: string;
};

type ComponentAnalysisItem = {
  term: string;
  meaning: string;
  relation_to_goods: string;
  distinctiveness: "식별력 있음" | "식별력 약함" | "식별력 없음";
};

type TrademarkReviewResult = {
  risk_level: "HIGH" | "LOW" | "REVIEW_NEEDED";
  ai_review_code: "G01" | "G02" | "G03" | "G04" | "G05" | "G06" | "OK" | "REVIEW";
  reason: string;
  component_analysis: ComponentAnalysisItem[];
  needs_manual_review: boolean;
};

const CORS_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GENERAL_HINTS = [
  "뉴스",
  "치과",
  "공방",
  "스튜디오",
  "랩",
  "클리닉",
  "센터",
  "연구소",
  "아카데미",
  "마켓",
  "샵",
  "스토어",
  "테크",
  "솔루션",
  "미디어",
  "저널",
  "리포트",
  "하우스",
  "플랫폼",
];

function response(statusCode: number, body: Json) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function safeJsonParse<T = unknown>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n\/;]+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeInput(body: TrademarkReviewRequest) {
  const markText =
    String(body.markText || body.trademark_name || "").trim();

  const goodsServices = toArray(body.goodsServices ?? body.goods_services);
  const classCodes = toArray(body.classCodes ?? body.class_codes);

  const channelName = String(body.channelName || body.channel_name || "").trim();
  const channelUrl = String(body.channelUrl || body.channel_url || "").trim();
  const interestType = String(body.interestType || body.interest_type || "").trim();

  return {
    markText,
    goodsServices,
    classCodes,
    channelName,
    channelUrl,
    interestType,
  };
}

function buildSystemInstruction(): string {
  return `
너는 한국 상표법의 절대적 부등록사유를 1차 검토하는 보조 AI다.
특히 상표법 제33조 제1항 제1호부터 제6호를 검토한다.

반드시 다음 순서로 판단한다.

1. 표장을 의미 단위로 분해한다.
2. 업종/서비스 명칭, 상품 종류 명칭, 설명적 표현, 관용적 표현, 단순 위치/지역명 등은 원칙적으로 식별력이 없는 부분으로 보고 제거 후보로 검토한다.
3. 다만 그 요소가 전체 상표의 핵심 식별 요소로 기능하는 경우에는 제거하지 않는다. 이 예외는 매우 제한적으로 인정한다.
4. 결합 상표에서 식별력 없는 부분을 제거하고, 실제 출처 식별 기능을 하는 핵심 식별 요소를 도출한다.
5. 핵심 식별 요소를 기준으로 제33조 제1항 제1호부터 제6호 해당 여부를 판단한다.
6. 판단은 반드시 지정상품/서비스와의 관계를 중심으로 한다.
7. 애매하거나 법률적 추가 검토가 필요하면 REVIEW_NEEDED로 판단한다.
8. JSON 객체만 출력한다.

[판단 기준]

- G01 보통명칭:
  지정상품의 명칭, 약칭, 속칭 등 거래사회에서 실제 상품을 지칭하는 명칭.
  핵심 단어가 보통명칭이면 HIGH.
  보통명칭 + 식별력 있는 단어면 LOW 또는 REVIEW_NEEDED.
  보통명칭 + 부수적 단어면 HIGH.

- G02 관용표장:
  동종업계에서 일반적으로 자유롭게 사용되는 표장.
  핵심 단어가 관용 명칭이면 HIGH.
  관용 명칭 + 식별력 있는 단어면 LOW 또는 REVIEW_NEEDED.
  관용 명칭 + 부수적 단어면 HIGH.

- G03 기술적 표장:
  성질, 산지, 품질, 원재료, 효능, 용도, 수량, 형상, 가격, 생산방법, 가공방법, 사용방법, 시기를 직감하는 명칭.
  품질(BEST, PREMIUM, SUPER), 원재료, 효능, 용도, 수량·규격·가격, 생산·가공·사용방법, 시기를 직접 나타내면 HIGH.
  간접적·암시적이면 LOW 또는 REVIEW_NEEDED.

- G04 현저한 지리적 명칭:
  국가명, 도시명, 관광지, 유명 지명 등.
  핵심 단어가 지리적 명칭이면 HIGH.
  지리적 명칭 + 식별력 있는 단어면 LOW 또는 REVIEW_NEEDED.
  지리적 명칭 + 부수적 단어면 HIGH.
  지리적 명칭 + 업종 단순 결합이면 HIGH.

- G05 흔한 성이나 명칭:
  김, 이, 박 등 흔한 성씨나 흔한 명칭.
  핵심 단어가 이에 해당하면 HIGH.
  흔한 성명 + 식별력 있는 단어면 LOW 또는 REVIEW_NEEDED.
  흔한 성명 + 부수적 단어면 HIGH.

- G06 흔한 표장:
  1글자 문자, 2글자 알파벳, 단순 숫자, 단순 도형 등 간단하고 흔한 표장.
  핵심 단어가 이에 해당하면 HIGH.
  흔한 표장 + 식별력 있는 단어면 LOW 또는 REVIEW_NEEDED.
  흔한 표장 + 부수적 단어면 HIGH.

[출력 원칙]
- HIGH: 절대적 부등록 사유 해당 가능성이 높음
- REVIEW_NEEDED: 애매하거나 법률적 추가 검토 필요
- LOW: 현 단계에서 절대적 부등록 사유 가능성이 비교적 낮음

[ai_review_code 기준]
- G01: 보통명칭
- G02: 관용표장
- G03: 기술적 표장
- G04: 현저한 지리적 명칭
- G05: 흔한 성이나 명칭
- G06: 흔한 표장
- OK: 현재 기준상 절대적 부등록 사유가 뚜렷하지 않음
- REVIEW: 경계사안 또는 복합적 판단 필요
`.trim();
}

function buildUserPrompt(input: {
  markText: string;
  goodsServices: string[];
  classCodes: string[];
  channelName: string;
  channelUrl: string;
  interestType: string;
}): string {
  const {
    markText,
    goodsServices,
    classCodes,
    channelName,
    channelUrl,
    interestType,
  } = input;

  return `
[검토 대상]
- 상표명: ${markText}
- 지정상품/서비스: ${goodsServices.join(", ") || "(없음)"}
- 류: ${classCodes.join(", ") || "(없음)"}
- 채널명/브랜드 참고정보: ${channelName || "(없음)"}
- 채널 URL: ${channelUrl || "(없음)"}
- 관심 유형: ${interestType || "(없음)"}

[작업 지시]
1. 원본 상표를 의미 단위로 분해하라.
2. 식별력 없는 부분과 핵심 식별 요소를 도출하라.
3. 핵심 식별 요소를 기준으로 G01~G06을 판단하라.
4. 지정상품/서비스와의 관계를 반드시 설명하라.
5. 최종 출력은 JSON 객체 하나만 반환하라.
`.trim();
}

function getResponseSchema() {
  return {
    type: "OBJECT",
    properties: {
      risk_level: {
        type: "STRING",
        enum: ["HIGH", "LOW", "REVIEW_NEEDED"],
      },
      ai_review_code: {
        type: "STRING",
        enum: ["G01", "G02", "G03", "G04", "G05", "G06", "OK", "REVIEW"],
      },
      reason: {
        type: "STRING",
      },
      component_analysis: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            term: { type: "STRING" },
            meaning: { type: "STRING" },
            relation_to_goods: { type: "STRING" },
            distinctiveness: {
              type: "STRING",
              enum: ["식별력 있음", "식별력 약함", "식별력 없음"],
            },
          },
          required: ["term", "meaning", "relation_to_goods", "distinctiveness"],
        },
      },
      needs_manual_review: {
        type: "BOOLEAN",
      },
    },
    required: [
      "risk_level",
      "ai_review_code",
      "reason",
      "component_analysis",
      "needs_manual_review",
    ],
  };
}

async function callGemini(systemInstruction: string, userPrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const payload = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topK: 20,
      topP: 0.9,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: getResponseSchema(),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text();
  const json = safeJsonParse<any>(rawText);

  if (!res.ok) {
    const apiMessage =
      json?.error?.message ||
      rawText ||
      `Gemini API request failed with status ${res.status}`;
    throw new Error(apiMessage);
  }

  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || "")
      .join("")
      ?.trim() || "";

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

function normalizeAiResult(raw: any): TrademarkReviewResult {
  const defaultResult: TrademarkReviewResult = {
    risk_level: "REVIEW_NEEDED",
    ai_review_code: "REVIEW",
    reason: "",
    component_analysis: [],
    needs_manual_review: true,
  };

  if (!raw || typeof raw !== "object") {
    return defaultResult;
  }

  const risk =
    raw.risk_level === "HIGH" ||
    raw.risk_level === "LOW" ||
    raw.risk_level === "REVIEW_NEEDED"
      ? raw.risk_level
      : "REVIEW_NEEDED";

  const code =
    ["G01", "G02", "G03", "G04", "G05", "G06", "OK", "REVIEW"].includes(raw.ai_review_code)
      ? raw.ai_review_code
      : risk === "LOW"
        ? "OK"
        : "REVIEW";

  const reason =
    typeof raw.reason === "string" && raw.reason.trim()
      ? raw.reason.trim()
      : "";

  const componentAnalysis: ComponentAnalysisItem[] = Array.isArray(raw.component_analysis)
    ? raw.component_analysis
        .map((item: any) => ({
          term: String(item?.term || "").trim(),
          meaning: String(item?.meaning || "").trim(),
          relation_to_goods: String(item?.relation_to_goods || "").trim(),
          distinctiveness:
            item?.distinctiveness === "식별력 있음" ||
            item?.distinctiveness === "식별력 약함" ||
            item?.distinctiveness === "식별력 없음"
              ? item.distinctiveness
              : "식별력 약함",
        }))
        .filter((item) => item.term || item.meaning || item.relation_to_goods)
    : [];

  let needsManualReview =
    typeof raw.needs_manual_review === "boolean"
      ? raw.needs_manual_review
      : risk !== "LOW";

  if (risk === "HIGH" && code === "OK") {
    return {
      risk_level: "REVIEW_NEEDED",
      ai_review_code: "REVIEW",
      reason: reason || "자동 검토 결과에 추가 확인이 필요합니다.",
      component_analysis: componentAnalysis,
      needs_manual_review: true,
    };
  }

  return {
    risk_level: risk,
    ai_review_code: code,
    reason,
    component_analysis: componentAnalysis,
    needs_manual_review: needsManualReview,
  };
}

export const handler = async (event: any) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return response(405, {
      ok: false,
      error: "Method Not Allowed",
    });
  }

  try {
    const body = safeJsonParse<TrademarkReviewRequest>(event.body || "{}");
    if (!body) {
      return response(400, {
        ok: false,
        error: "Invalid JSON body",
      });
    }

    const input = normalizeInput(body);

    if (!input.markText) {
      return response(400, {
        ok: false,
        error: "markText or trademark_name is required",
      });
    }

    if (input.goodsServices.length === 0) {
      return response(400, {
        ok: false,
        error: "goodsServices or goods_services is required",
      });
    }

    const systemInstruction = buildSystemInstruction();
    const userPrompt = buildUserPrompt(input);

    const rawModelText = await callGemini(systemInstruction, userPrompt);
    const parsedModelJson = safeJsonParse<any>(rawModelText);
    const normalized = normalizeAiResult(parsedModelJson);

    return response(200, {
      ok: true,
      input: {
        markText: input.markText,
        goodsServices: input.goodsServices,
        classCodes: input.classCodes,
      },
      review: normalized,
      reviewed_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[review-trademark] error:", error);

    return response(500, {
      ok: false,
      error: error?.message || "Internal Server Error",
      review: {
        risk_level: "REVIEW_NEEDED",
        ai_review_code: "REVIEW",
        reason: "서버 또는 AI 응답 처리 오류로 인해 수동 검토가 필요합니다.",
        component_analysis: [],
        needs_manual_review: true,
      },
    });
  }
};
