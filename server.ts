import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
app.use(express.json({ limit: '10mb' }));
const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post("/api/generate-quiz", async (req, res) => {
  const { fileData, mimeType, questionCount, difficulty } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
  }

  try {
    const prompt = `You are an expert quiz generator. Analyse the provided document image carefully. Generate ${questionCount} quiz questions at ${difficulty} difficulty level. Your questions must test genuine comprehension and critical understanding, not just surface facts. Vary question types across factual recall, inference, application and analysis. Return ONLY a valid JSON array with no markdown, no code blocks, no explanation. Each object in the array must have exactly these fields: question as a string, options as an array of exactly 4 strings, correctIndex as a number 0 to 3, explanation as a string of one to two sentences explaining why the answer is correct.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: fileData,
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    let jsonStr = response.text!.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
    res.json(JSON.parse(jsonStr));
  } catch (error) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: "Failed to generate quiz." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
