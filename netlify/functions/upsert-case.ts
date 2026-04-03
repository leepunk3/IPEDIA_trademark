import type { Handler } from "@netlify/functions";
import { supabase } from "./_lib/supabase";
import { getEmbedding } from "./_lib/embed";

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    const body = JSON.parse(event.body || "{}");

    const {
      mark_text,
      goods_services,
      decision,
      ground_code = "",
      reason = "",
      non_distinctive_parts = [],
      descriptive_parts = []
    } = body;

    if (!mark_text || !goods_services || !decision) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "mark_text, goods_services, decision required"
        })
      };
    }

    const combinedText = `${mark_text} [SEP] ${goods_services}`;
    const embedding = await getEmbedding(combinedText);

    const { data, error } = await supabase
      .from("trademark_cases")
      .insert({
        mark_text,
        goods_services,
        combined_text: combinedText,
        decision,
        ground_code,
        reason,
        non_distinctive_parts,
        descriptive_parts,
        embedding
      })
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, data })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
