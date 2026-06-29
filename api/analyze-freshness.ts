
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, mimeType: incomingMimeType } = req.body;
    if (!image) return res.status(400).json({ error: "Missing image data." });

    let base64Data = image;
    let mimeType = incomingMimeType || "image/jpeg";
    if (image.startsWith("data:")) {
      const parts = image.split(",");
      base64Data = parts[1];
      const match = parts[0].match(/data:(.*?);/);
      if (match) mimeType = match[1];
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",   // ← fixed model name (gemini-3.5-flash doesn't exist)
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "You are an expert horticulturalist, food safety inspector, and freshness assessor. Analyze this image of a fruit or vegetable, evaluate its physical condition, skin status, indicators of decomposition (or flawless maturation), and calculate its remaining shelf life under standard household conditions. Respond strictly with a JSON object conforming to the given schema." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING, description: "The specific common name of the detected fruit or vegetable." },
            isFresh: { type: Type.BOOLEAN, description: "True if the item is fresh or easily trimmed." },
            freshnessStatus: { type: Type.STRING },
            freshnessPercentage: { type: Type.INTEGER },
            shelfLifeEstimateDays: { type: Type.INTEGER },
            shelfLifeRange: { type: Type.STRING },
            visualObservations: { type: Type.ARRAY, items: { type: Type.STRING } },
            storageRecommendation: { type: Type.STRING },
            idealEnvironment: { type: Type.STRING },
            spoilageSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
            culinaryAdvice: { type: Type.STRING },
          },
          required: ["itemName","isFresh","freshnessStatus","freshnessPercentage","shelfLifeEstimateDays","shelfLifeRange","visualObservations","storageRecommendation","idealEnvironment","spoilageSignals","culinaryAdvice"],
        },
      },
    });

    const text = response.text || "{}";
    return res.status(200).json(JSON.parse(text));
  } catch (error: any) {
    console.error("Freshness analysis error:", error);
    return res.status(500).json({ error: error.message || "Analysis failed." });
  }
}
