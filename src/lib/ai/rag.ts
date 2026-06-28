import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export interface KnowledgeChunk {
  text: string;
  documentId: string;
  score?: number;
}

/**
 * Generate embeddings using Gemini's text-embedding-004 or OpenAI's text-embedding-3-small
 */
export async function getEmbedding(text: string, provider: string = "GEMINI", apiKey?: string): Promise<number[]> {
  const selectedProvider = provider.toUpperCase();

  try {
    if (selectedProvider === "GEMINI") {
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (!key) throw new Error("Gemini API Key is not configured for embeddings.");

      const ai = new GoogleGenAI({ apiKey: key });
      const response = (await ai.models.embedContent({
        model: "text-embedding-004",
        contents: text,
      })) as any;

      if (response.embedding?.values) {
        return response.embedding.values;
      }
      if (response.embeddings?.[0]?.values) {
        return response.embeddings[0].values;
      }
      throw new Error("No embedding values returned from Gemini.");
    } else {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) throw new Error("OpenAI API Key is not configured for embeddings.");

      const openai = new OpenAI({ apiKey: key });
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });

      return response.data[0].embedding;
    }
  } catch (error) {
    console.error("Error generating text embeddings:", error);
    // Return empty embedding rather than crashing
    return new Array(768).fill(0);
  }
}

/**
 * Local cosine similarity calculation
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieve relevant chunks for a business based on query similarity.
 * In a fully-scaled system, this queries pgvector or Pinecone.
 * For local setup/fallback, we query the PostgreSQL text base or mock vectors.
 */
export async function retrieveRelevantContext(
  businessId: string,
  query: string,
  provider: string = "GEMINI",
  apiKey?: string
): Promise<string> {
  // Generate query embedding
  const queryEmbedding = await getEmbedding(query, provider, apiKey);

  // In production, run:
  // const chunks = await db.$queryRaw`
  //   SELECT text, document_id, embedding <=> ${queryEmbedding}::vector as distance 
  //   FROM "KnowledgeChunk" 
  //   WHERE business_id = ${businessId} 
  //   ORDER BY distance LIMIT 3
  // `;
  
  // Here we provide a mock/simple text scan fallback based on standard DB structures:
  try {
    // Standard mock documents/hardcoded business rules to ensure RAG functions out-of-the-box
    const fallbacks: Record<string, string[]> = {
      "Echo Sunnah Hijama & Cupping Center": [
        "Echo Sunnah Hijama & Cupping Center is located at 12/A, Dhanmondi, Dhaka, Bangladesh. We are open Saturday to Thursday, 10:00 AM to 8:30 PM.",
        "Pricing for Hijama (Wet Cupping therapy) is 150 BDT per cup. Consultation fee is 500 BDT, which is waived if cupping therapy is taken.",
        "Our services include Hijama (Wet Cupping), Dry Cupping, Fire Cupping, Massage therapy, and herbal consultation.",
        "Contact Number: +8801712345678. Support Email: info@echosunnah.com.",
        "All procedures are done under strict hygienic conditions. We use single-use sterile cups and surgical blades."
      ]
    };

    // Find if the query matches keywords in our sample data
    let matchedChunks: string[] = [];
    const keys = Object.keys(fallbacks);
    const matchedKey = keys.find(k => query.toLowerCase().includes(k.toLowerCase()) || query.toLowerCase().includes("hijama") || query.toLowerCase().includes("pricing") || query.toLowerCase().includes("location"));
    
    if (matchedKey) {
      matchedChunks = fallbacks[matchedKey];
    }

    if (matchedChunks.length > 0) {
      return matchedChunks.slice(0, 3).join("\n\n");
    }

    return "No business specific documents found in knowledge base.";
  } catch (error) {
    console.error("RAG retrieval error:", error);
    return "";
  }
}
