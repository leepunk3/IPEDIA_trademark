export async function getEmbedding(text: string): Promise<number[]> {
  const embeddingApiUrl = process.env.EMBEDDING_API_URL;
  const embeddingApiKey = process.env.EMBEDDING_API_KEY || "";

  if (!embeddingApiUrl) {
    throw new Error("Missing EMBEDDING_API_URL");
  }

  const res = await fetch(embeddingApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": embeddingApiKey ? `Bearer ${embeddingApiKey}` : ""
    },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Embedding API error: ${res.status} ${errorText}`);
  }

  const data = await res.json();

  if (!data || !Array.isArray(data.embedding)) {
    throw new Error("Invalid embedding response");
  }

  return data.embedding;
}
