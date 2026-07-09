import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Sends a JSON-only prompt to Gemini and parses the result. Models sometimes
 * wrap JSON in ```json fences despite instructions not to — strip those
 * before parsing.
 */
export async function generateJSON<T>(prompt: string): Promise<T> {
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Gemini did not return valid JSON: ${cleaned.slice(0, 200)}`);
  }
}
