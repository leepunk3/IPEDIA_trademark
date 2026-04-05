import type { Handler } from "@netlify/functions";
import { supabase } from "./_lib/supabase";
import { getEmbedding } from "./_lib/embed";

type RiskLevel = "HIGH" | "REVIEW_NEEDED" | "LOW";

const GENERIC_TERMS = [
  "치과",
  "병원",
  "뉴스",
  "공방",
  "스토어",
  "패치",
  "크림",
  "솔루션",
  "시스템",
  "플랫폼",
  "센터",
  "랩",
  "클리닉",
  "몰",
  "샵",
  "마켓"
];

const DESCRIPTIVE_HINTS = [
  "수면",
  "진단",
  "치료",
  "로봇",
  "그리퍼",
  "플러시",
  "완구",
  "의료",
  "패치",
  "헬스",
  "케어",
  "뉴스",
  "치과"
];

function normalizeText(text: string): string {
  return (text || "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitKoreanCompound(token: string): string[] {
  const suffixes = [
    "뉴스",
    "치과",
    "병원",
    "공방",
    "스토어",
    "패치",
    "솔루션",
    "시스템",
    "플랫폼",
    "센터",
    "클리닉",
    "랩",
    "몰",
    "샵",
    "마켓"
  ];

  const result = [token];

  for (const suffix of suffixes) {
    if (token.length > suffix.length && token.endsWith(suffix)) {
      const head = token.slice(0, token.length - suffix.length);
      if (head) result.push(head);
      result.push(suffix);
    }
  }

  return [...new Set(result)];
}

function extractTerms(markText: string): string[] {
  const normalized = normalizeText(markText);
  const baseTokens = normalized.split(" ").filter(Boolean);

  const expanded: string[] = [];

  for (const token of baseTokens) {
    expanded.push(token);
    const splitTokens = splitKoreanCompound(token);
    expanded.push(...splitTokens);
  }

  return [...new Set(expanded)];
}

function detectNonDistinctive(tokens: string[]): string[] {
  return tokens.filter((t) => GENERIC_TERMS.includes(t));
}

function detectDescriptive(tokens: string[], goodsServices: string[]): string[] {
  const joinedGoods = goodsServices.join(" ");

  const result = tokens.filter((token) => {
    if (joinedGoods.includes(token)) return true;
    if (DESCRIPTIVE_HINTS.includes(token) && joinedGoods.includes(token)) return true;
    return false;
  });

  return [...new Set(result)];
}

function checkOnlyNonDistinctive(
  tokens: string[],
  nonDistinctive: string[],
  descriptive: string[]
): boolean {
  if (!tokens.length) return false;
  const union = new Set([...nonDistinctive, ...descriptive]);
  return tokens.every((t) => union.has(t));
}

function buildGroundCode(
  onlyNonDistinctive: boolean,
  nonDistinctive: string[],
  descriptive: string[]
): string {
  if (onlyNonDistinctive && descriptive.length > 0) return "G03";
  if (onlyNonDistinctive && nonDistinctive.length > 0) return "G01";
  if (descriptive.length > 0) return "G03";
  if (nonDistinctive.length > 0) return "REVIEW";
  return "";
}

function determineRisk(
  onlyNonDistinctive: boolean,
  descriptiveCount: number,
  nonDistinctiveCount: number
): RiskLevel {
  if (onlyNonDistinctive) return "HIGH";
  if (descriptiveCount > 0) return "REVIEW_NEEDED";
  if (nonDistinctiveCount > 0) return "REVIEW_NEEDED";
  return "LOW";
}

function buildReason(params: {
  nonDistinctive: string[];
  descriptive: string[];
  onlyNonDistinctive: boolean;
  similarHighCount: number;
  similarCasesCount: number;
}): string {
  const {
    nonDistinctive,
    descriptive,
    onlyNonDistinctive,
    similarHighCount,
    similarCasesCount
  } = params;

  const lines: string[] = [];

  if (nonDistinctive.length > 0) {
    lines.push(`식별력 약한 요소 후보: ${nonDistinctive.join(", ")}`);
  }

  if (descriptive.length > 0) {
    lines.push(`지정상품과 직접 관련된 기술적 요소 후보: ${descriptive.join(", ")}`);
  }

  if (onlyNonDistinctive) {
    lines.push("표장이 비식별적 요소만으로 구성될 가능성이 있습니다.");
  }

  if (similarCasesCount > 0 && similarHighCount >= 3) {
    lines.push("유사 사례 다수가 고위험으로 분류되어 수동 검토가 강하게 권장됩니다.");
  }

  if (lines.length === 0) {
    lines.push("현재 기준상 식별력 있는 요소가 남아 있을 가능성이 있습니다.");
  }

  return lines.join(" ");
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const markText = body.mark_text || "";
    const goodsServices = Array.isArray(body.goods_services)
      ? body.goods_services
      : [];

    if (!markText || goodsServices.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "mark_text and goods_services[] are required"
        })
      };
    }

    const tokens = extractTerms(markText);
    const nonDistinctive = detectNonDistinctive(tokens);
    const descriptive = detectDescriptive(tokens, goodsServices);
    const onlyNonDistinctive = checkOnlyNonDistinctive(
      tokens,
      nonDistinctive,
      descriptive
    );

    let riskLevel = determineRisk(
      onlyNonDistinctive,
      descriptive.length,
      nonDistinctive.length
    );

    const groundCode = buildGroundCode(
      onlyNonDistinctive,
      nonDistinctive,
      descriptive
    );

    const combinedText = `${markText} [SEP] ${goodsServices.join(", ")}`;
    // 임시: embedding 제거
    let similarCases = [];
    let similarHighCount = 0;

    if (riskLevel === "REVIEW_NEEDED" && similarHighCount >= 3) {
      riskLevel = "HIGH";
    }

    const reason = buildReason({
      nonDistinctive,
      descriptive,
      onlyNonDistinctive,
      similarHighCount,
      similarCasesCount: similarCases.length
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        result: {
          tokens,
          non_distinctive_parts: nonDistinctive,
          descriptive_parts: descriptive,
          only_non_distinctive: onlyNonDistinctive,
          ground_code: groundCode,
          risk_level: riskLevel,
          result_page_type:
            riskLevel === "HIGH"
              ? "HIGH_RISK"
              : riskLevel === "REVIEW_NEEDED"
              ? "MEDIUM_RISK"
              : "LOW_RISK",
          need_manual: riskLevel === "LOW" ? "N" : "Y",
          reason
        }
      })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "Unknown error"
      })
    };
  }
};
