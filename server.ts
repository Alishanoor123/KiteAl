import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "2mb" }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Fallback ladder model array with verified modern Gemini models
const GEMINI_MODELS_LADDER = [
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

// Helper to execute a promise with a strict timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

// Helper to generate content with resilient fallback ladder and timeout
async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestConfig: {
    contents: any;
    config?: any;
  }
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;

  for (const modelName of GEMINI_MODELS_LADDER) {
    try {
      console.log(`[Gemini API] Attempting generateContent with model: ${modelName}`);
      
      // Enforce a 14-second timeout per model attempt to prevent hanging
      const response = await withTimeout(
        ai.models.generateContent({
          model: modelName,
          contents: requestConfig.contents,
          config: requestConfig.config,
        }),
        14000,
        `Timeout waiting for response from model: ${modelName}`
      );

      const responseText = response.text || "";
      if (responseText && responseText.trim().length > 0) {
        console.log(`[Gemini API] Success with model: ${modelName}`);
        return { text: responseText.trim(), modelUsed: modelName };
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Failed or timed out with model ${modelName}:`, err.message || err);
      lastError = err;
      // Continue to next model in ladder immediately
    }
  }

  throw new Error(
    `All Gemini fallback models exhausted (${GEMINI_MODELS_LADDER.join(", ")}). Last error: ${lastError?.message || "Unknown error"}`
  );
}

// Reflection and AI Interaction endpoint
app.post("/api/gemini/reflect", async (req, res) => {
  try {
    const { messages, mode, mood, title } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "At least one message is required." });
    }

    // Filter and sanitize message contents so text is never null, empty, or undefined
    const validMessages = messages.filter(
      (m: any) => m && typeof m.content === "string" && m.content.trim().length > 0
    );

    if (validMessages.length === 0) {
      return res.status(400).json({ error: "Message content cannot be empty." });
    }

    const ai = getGenAI();

    // Mode & Mood specific system instructions with warm, mindful guidance
    let systemInstruction = `You are an empathetic, thoughtful, and insightful AI reflection companion and executive journaling coach.
Your role is to deeply engage with the author's thoughts, experiences, decisions, and emotions.
- Be supportive, mindful, and analytical with a warm, grounded voice.
- Structure your response cleanly using Markdown with intuitive headings, bullet points, or bold takeaways.
- Provide practical clarity, uncover underlying themes, and offer thoughtful prompts or perspectives for deeper exploration.`;

    if (mood && typeof mood === "string") {
      systemInstruction += `\n\n[AUTHOR MOOD STATE]: The author has tagged their current mood as "${mood}". 
Adapt your tone, empathy level, and pacing to complement this state:
- If Focused: Be crisp, clear, structured, and action-oriented.
- If Reflective: Offer deep, contemplative philosophical depth and celebrate self-awareness.
- If Anxious: Provide calm, grounding reassurance, de-escalate overwhelm, and help break daunting issues into gentle, manageable pieces.
- If Creative: Fuel ideation, challenge conventional limits, and connect lateral concepts.`;
    }

    if (mode === "summary") {
      systemInstruction += `\nMode: Executive Summary & Key Themes.
Provide a concise, beautifully structured executive summary of the author's entry, followed by 3-5 core takeaways and recurring emotional/intellectual themes.`;
    } else if (mode === "brainstorm") {
      systemInstruction += `\nMode: Creative Brainstorming & Possibilities.
Generate diverse, high-value ideas, alternative pathways, innovative angles, and creative next steps based on the reflection.`;
    } else if (mode === "action_items") {
      systemInstruction += `\nMode: Pragmatic Action Plan.
Distill the reflection into concrete, prioritized action items, potential obstacles to anticipate, and an achievable 24-48 hour starting step.`;
    } else if (mode === "deep_inquiry") {
      systemInstruction += `\nMode: Socratic Deep Inquiry.
Ask 3-4 profound, perspective-shifting questions that challenge unexamined assumptions and help the author discover their own internal truth.`;
    }

    // Format chat history for Gemini API
    const formattedContents = validMessages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "").trim() }],
    }));

    // Call Gemini with fallback ladder (primary: gemini-3.6-flash)
    const { text: responseText, modelUsed } = await generateContentWithFallback(ai, {
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // Optional title generator if title is empty or default
    let suggestedTitle: string | undefined = undefined;
    const isUntitled =
      !title ||
      typeof title !== "string" ||
      title.trim() === "" ||
      title.toLowerCase() === "untitled reflection" ||
      title.toLowerCase() === "new entry";

    if (isUntitled && validMessages.length > 0) {
      try {
        const firstUserMsg = validMessages.find((m: any) => m.role === "user") || validMessages[0];
        const { text: titleText } = await generateContentWithFallback(ai, {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Based on this journal entry, generate a concise, evocative, and dignified title in 3 to 6 words without quotes or punctuation:\n\n${firstUserMsg.content.slice(0, 300)}`,
                },
              ],
            },
          ],
          config: {
            temperature: 0.5,
          },
        });
        const cleanTitle = titleText?.trim().replace(/^["']|["']$/g, "");
        if (cleanTitle && cleanTitle.length > 0 && cleanTitle.length < 60) {
          suggestedTitle = cleanTitle;
        }
      } catch (tErr) {
        console.warn("Title generation skipped or timed out:", tErr);
      }
    }

    return res.json({
      text: responseText,
      suggestedTitle,
      mode: mode || "reflect",
      modelUsed,
    });
  } catch (error: any) {
    console.error("Error in /api/gemini/reflect:", error);
    return res.status(500).json({
      error: error.message || "Failed to process reflection with Gemini AI. Please try again.",
    });
  }
});

// Vite middleware & Static Serving
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
