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
    const { mark_text, goods_services, match_count = 5 } = body;

    if (!mark_text || !goods_services) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "mark_text and goods_services required"
        })
      };
    }

    const combinedText = `${mark_text} [SEP] ${goods_services}`;
    const embedding = await getEmbedding(combinedText);

    const { data, error } = await supabase.rpc("match_trademark_cases", {
      query_embedding: embedding,
      match_count
    });

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        matches: data || []
      })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
