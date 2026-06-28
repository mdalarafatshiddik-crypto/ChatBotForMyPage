import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export interface GenerateChatResponseArgs {
  provider: string; // GEMINI, OPENAI
  model: string;     // e.g. gemini-1.5-flash, gpt-4o
  systemInstruction: string;
  history: Array<{ role: "user" | "model" | "assistant"; content: string }>;
  prompt: string;
  apiKey?: string;   // Optional tenant-specific API key, falls back to env variable
}

export interface ChatResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

export async function generateChatResponse(args: GenerateChatResponseArgs): Promise<ChatResponse> {
  const provider = args.provider.toUpperCase();

  if (provider === "GEMINI") {
    const key = args.apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Gemini API Key is not configured.");
    }

    const ai = new GoogleGenAI({ apiKey: key });

    // Format history for Gemini SDK
    // Roles in Gemini must be 'user' or 'model'
    const formattedContents = args.history.map(item => ({
      role: item.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: item.content }],
    }));

    // Append the latest user query
    formattedContents.push({
      role: "user",
      parts: [{ text: args.prompt }],
    });

    const response = await ai.models.generateContent({
      model: args.model || "gemini-1.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: args.systemInstruction,
        temperature: 0.3,
      },
    });

    const text = response.text || "I apologize, I could not generate a response.";
    
    // Estimate tokens if usage statistics are missing
    const promptTokens = response.usageMetadata?.promptTokenCount ?? Math.ceil(args.prompt.length / 4);
    const completionTokens = response.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4);

    return {
      text,
      usage: {
        promptTokens,
        completionTokens,
      },
    };
  } else if (provider === "OPENAI") {
    const key = args.apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("OpenAI API Key is not configured.");
    }

    const openai = new OpenAI({ apiKey: key });

    // Format history for OpenAI ChatCompletion
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: args.systemInstruction },
      ...args.history.map(item => ({
        role: (item.role === "model" ? "assistant" : "user") as "assistant" | "user",
        content: item.content,
      })),
      { role: "user", content: args.prompt },
    ];

    const response = await openai.chat.completions.create({
      model: args.model || "gpt-4o-mini",
      messages,
      temperature: 0.3,
    });

    const text = response.choices[0].message?.content || "I apologize, I could not generate a response.";
    const promptTokens = response.usage?.prompt_tokens ?? Math.ceil(args.prompt.length / 4);
    const completionTokens = response.usage?.completion_tokens ?? Math.ceil(text.length / 4);

    return {
      text,
      usage: {
        promptTokens,
        completionTokens,
      },
    };
  } else {
    throw new Error(`Unsupported AI model provider: ${provider}`);
  }
}
