import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON payload limits for image uploads
app.use(express.json({ limit: "25mb" }));

// Initialize Gemini client strictly with named config and Agent User header
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment. Please add it via the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. API Route for food and vegetable freshness prediction
app.post("/api/analyze-freshness", async (req, res): Promise<any> => {
  try {
    const { image, mimeType: incomingMimeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image data in request body." });
    }

    // Clean data URL format if present
    let base64Data = image;
    let mimeType = incomingMimeType || "image/jpeg";
    if (image.startsWith("data:")) {
      const parts = image.split(",");
      const meta = parts[0];
      base64Data = parts[1];
      const match = meta.match(/data:(.*?);/);
      if (match) {
        mimeType = match[1];
      }
    }

    const ai = getGeminiClient();

    const textPart = {
      text: "You are an expert horticulturalist, food safety inspector, and freshness assessor. Analyze this image of a fruit or vegetable, evaluate its physical condition, skin status, indicators of decomposition (or flawless maturation), and calculate its remaining shelf life under standard household conditions. Respond strictly with a JSON object conforming to the given schema.",
    };

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: {
              type: Type.STRING,
              description: "The specific common name of the detected fruit or vegetable (e.g. 'Cavendish Banana', 'Gala Apple', 'Roma Tomato').",
            },
            isFresh: {
              type: Type.BOOLEAN,
              description: "True if the item is fresh, safe to eat or easily trimmed. False if it has severe decay, unsafe mold, or is unfit/unpleasant to eat.",
            },
            freshnessStatus: {
              type: Type.STRING,
              description: "Short categorical description: e.g. Perfect, Fresh, Slightly Bruised, Overripe, Severely Decayed.",
            },
            freshnessPercentage: {
              type: Type.INTEGER,
              description: "Freshness level represented between 0 (completely rotten/moldy) and 100 (flawless, freshly harvested or at absolute peak).",
            },
            shelfLifeEstimateDays: {
              type: Type.INTEGER,
              description: "Optimal estimated number of days the item will remain edible/fresh under standard storage settings (0 if already inedible/spoiled).",
            },
            shelfLifeRange: {
              type: Type.STRING,
              description: "Short user-friendly storage range string representation, eg: '4-6 days', 'Eat today', 'Overripe - use in recipes immediately', or 'Expired'.",
            },
            visualObservations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of precise visual markers or defects seen (e.g. 'Slight indentation near stem', 'Dark brown spots overall', 'Firm skin with shiny outer wax layer').",
            },
            storageRecommendation: {
              type: Type.STRING,
              description: "A constructive, highly detailed physical recommendation for preserving and lengthening this item's life.",
            },
            idealEnvironment: {
              type: Type.STRING,
              description: "Where this specific fruit or vegetable stays fresh longest (e.g. 'Separate from bananas inside high humidity crisper drawer', 'Dry open-air wicker basket').",
            },
            spoilageSignals: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A few clear indicators of spoilage the user should smell, touch, or look for to know this specific produce has definitely gone bad (e.g. 'Sour alcoholic smell', 'Skin feels soft and squishy', 'White fuzzy mold patches').",
            },
            culinaryAdvice: {
              type: Type.STRING,
              description: "Empathetic recipe recommendation or consumption tip fitting its current stage of maturity. What to cook or make with this (e.g. 'Ideal for making banana bread or smoothie bags to freeze', 'Excellent for a crisp salad today').",
            },
          },
          required: [
            "itemName",
            "isFresh",
            "freshnessStatus",
            "freshnessPercentage",
            "shelfLifeEstimateDays",
            "shelfLifeRange",
            "visualObservations",
            "storageRecommendation",
            "idealEnvironment",
            "spoilageSignals",
            "culinaryAdvice"
          ],
        },
      },
    });

    const parsedResponseText = response.text || "{}";
    res.json(JSON.parse(parsedResponseText));
  } catch (error: any) {
    console.error("Freshness analysis server error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while evaluating freshness. Please check your image or your Gemini API setup.",
    });
  }
});

// 2. Vite middleware setup or production static directories
async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files server mounted.");
  }

  app.listen(PORT, "localhost", () => {
    console.log(`Server initialized and listening on http://localhost:${PORT}`);
  });
}

startApp().catch((err) => {
  console.error("Fatal server startup failure:", err);
});
