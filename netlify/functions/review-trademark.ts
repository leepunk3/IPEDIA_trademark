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
너는 한국 상표법 제33조 제1항 및 제34조 제1항의 절대적 등록요건을 검토하는 상표 심사 보조 AI다.

반드시 다음 원칙을 따른다.

1. 표장을 의미 단위로 분해한다.
2. 각 구성요소의 의미를 설명한다.
3. 각 구성요소가 지정상품/서비스와의 관계에서 보통명칭, 관용표장, 기술적 표장, 품질/효능/용도/업종/제공장소 등을 직접 표시하는지 검토한다.
4. 판단은 반드시 지정상품/서비스와의 관계에서 한다.
5. 표장 전체가 식별력 없는 요소들만으로 이루어진 경우에는 등록가능성이 낮다고 본다.
6. 일부 요소가 식별력이 없더라도 전체 조합이 출처표시로 인식될 수 있으면 무조건 HIGH로 단정하지 않는다.
7. 특히 "~만으로 된 상표"인지 엄격하게 판단한다.
8. 단어가 일반명사라는 이유만으로 곧바로 HIGH로 판단하지 말고, 지정상품/서비스와의 관계를 중심으로 판단한다.
9. 결과는 반드시 한국어로 작성한다.
10. 반드시 JSON 객체만 출력한다. 마크다운, 코드블록, 설명문을 붙이지 않는다.
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
다음 상표를 한국 상표법 제33조 제1항 제1호부터 제6호 기준으로 검토하라.

[표장]
${markText}

[지정상품/서비스]
${goodsServices.join(", ") || "(없음)"}

[1단계: 식별력 없는 요소 제거]

다음 요소는 원칙적으로 식별력이 없는 부분으로 간주하고 제거한다:

- 업종/서비스 명칭 (치과, 병원, 뉴스, 공방, 스튜디오, 카페, 마켓, 센터 등)
- 상품/서비스 종류 명칭
- 설명적 표현 (프리미엄, 베스트, 공식, 정품 등)
- 관용적 표현
- 단순 지리명 (서울, 강남 등)

단, 해당 요소가 전체 상표의 핵심 식별 요소로 기능하는 경우에는 제거하지 않는다 (매우 제한적으로 인정).

[2단계: 핵심 식별 요소 추출]

- 식별력 없는 요소를 제거하고 핵심 단어만 남긴다
- 반드시 아래 3가지를 도출한다:

- 원본 상표
- 식별력 없는 부분
- 핵심 식별 요소

[3단계: 법적 판단]

다음 기준으로 판단한다:

① 보통명칭 (G01)
- 핵심 단어가 상품의 일반 명칭이면 → HIGH
- 보통명칭 + 식별력 있는 단어 → LOW 또는 REVIEW_NEEDED
- 보통명칭 + 부수적 단어 → HIGH

② 관용표장 (G02)
- 업계에서 일반적으로 쓰이는 표현이면 → HIGH
- 관용표장 + 식별력 단어 → LOW 또는 REVIEW_NEEDED
- 관용표장 + 부수적 단어 → HIGH

③ 기술적 표장 (G03)
- 품질, 효능, 용도, 원재료, 가격, 방법 등을 직감하면 → HIGH
- 간접적/암시적이면 → REVIEW_NEEDED 또는 LOW

세부 기준:
- 품질: PREMIUM, BEST 등
- 원재료: 실제 재료명
- 효능: 효과 표현
- 용도: 사용 목적
- 수량/규격: 100ml, 1kg 등
- 방법: 수제, 훈제 등
- 시기: 여름, 겨울 등

④ 지리적 명칭 (G04)
- 국가, 도시, 지역명 → HIGH
- 지리명 + 업종 → HIGH
- 지리명 + 식별력 단어 → REVIEW_NEEDED 또는 LOW

⑤ 흔한 성명 (G05)
- 김, 이, 박 등 → HIGH
- 성명 + 식별력 단어 → REVIEW_NEEDED 또는 LOW

⑥ 간단표장 (G06)
- 1글자, 2글자 알파벳, 숫자 등 → HIGH
- 단순 조합 → HIGH

[최종 판단 기준]

- 식별력 없는 요소만으로 구성 → HIGH
- 일부 식별력 요소 존재 → LOW 또는 REVIEW_NEEDED
- 반드시 하나 선택:
  HIGH / REVIEW_NEEDED / LOW

[출력 형식]

반드시 아래 JSON만 출력하라:

{
  "risk_level": "LOW | REVIEW_NEEDED | HIGH",
  "ai_review_code": "NONE | DESCRIPTIVE | GENERIC | GEOGRAPHIC | NON_DISTINCTIVE | OTHER",
  "reason": "판단 이유 (2~5문장)",
  "needs_manual_review": true,
  "suggested_message": "고객 안내 메시지",
  "analysis": {
    "original_mark": "${markText}",
    "removed_terms": ["식별력 없는 단어"],
    "core_terms": ["핵심 식별 요소"]
  }
}
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
    reason: "AI 응답이 불완전하여 수동 검토가 필요합니다.",
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
      : "REVIEW";

  const reason =
    typeof raw.reason === "string" && raw.reason.trim()
      ? raw.reason.trim()
      : defaultResult.reason;

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
      : true;

  // 안전장치
  if (!reason) {
    needsManualReview = true;
  }

  if (risk === "HIGH" && code === "OK") {
    needsManualReview = true;
    return {
      risk_level: "REVIEW_NEEDED",
      ai_review_code: "REVIEW",
      reason: "AI 응답의 위험도와 코드가 상충하여 수동 검토가 필요합니다.",
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
