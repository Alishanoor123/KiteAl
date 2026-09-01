import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

const GEMINI_MODELS_LADDER = [
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
];

async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestConfig: { contents: any; config?: any }
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;
  for (const modelName of GEMINI_MODELS_LADDER) {
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: requestConfig.contents,
            config: requestConfig.config,
          }),
          15000,
          `Timeout waiting for response from model: ${modelName}`
        );
        const responseText = response.text || "";
        if (responseText && responseText.trim().length > 0) {
          return { text: responseText.trim(), modelUsed: modelName };
        }
      } catch (err: any) {
        lastError = err;
        const isRateLimitOrUnavailable =
          err?.status === 429 ||
          err?.status === 503 ||
          (err?.message && (
            err.message.includes("429") ||
            err.message.includes("503") ||
            err.message.includes("RESOURCE_EXHAUSTED") ||
            err.message.includes("UNAVAILABLE")
          ));
        if (isRateLimitOrUnavailable && attempt < 2) {
          await delay((attempt + 1) * 1500);
          continue;
        }
        break;
      }
    }
  }
  throw new Error(lastError?.message || "Failed to generate AI response from Gemini.");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing in Vercel settings.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { messages, mode, mood, title } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'At least one message is required.' });
    }

    const validMessages = messages.filter(
      (m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0
    );

    if (validMessages.length === 0) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    let systemInstruction = `You are an empathetic, thoughtful, and insightful AI reflection companion and executive journaling coach.
Your role is to deeply engage with the author's thoughts, experiences, decisions, and emotions.
- Be supportive, mindful, and analytical with a warm, grounded voice.
- Structure your response cleanly using Markdown with intuitive headings, bullet points, or bold takeaways.
- Provide practical clarity, uncover underlying themes, and offer thoughtful prompts or perspectives for deeper exploration.`;

    if (mood && typeof mood === 'string') {
      systemInstruction += `\n\n[AUTHOR MOOD STATE]: The author has tagged their current mood as "${mood}".`;
    }

    if (mode === 'summary') {
      systemInstruction += `\nMode: Executive Summary & Key Themes.`;
    } else if (mode === 'brainstorm') {
      systemInstruction += `\nMode: Creative Brainstorming & Possibilities.`;
    } else if (mode === 'action_items') {
      systemInstruction += `\nMode: Pragmatic Action Plan.`;
    } else if (mode === 'deep_inquiry') {
      systemInstruction += `\nMode: Socratic Deep Inquiry.`;
    }

    const formattedContents = validMessages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').trim() }],
    }));

    const { text: responseText, modelUsed } = await generateContentWithFallback(ai, {
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    let suggestedTitle: string | undefined = undefined;
    const isUntitled =
      !title ||
      typeof title !== 'string' ||
      title.trim() === '' ||
      title.toLowerCase() === 'untitled reflection' ||
      title.toLowerCase() === 'new entry';

    if (isUntitled && validMessages.length > 0) {
      try {
        const firstUserMsg = validMessages.find((m: any) => m.role === 'user') || validMessages[0];
        const { text: titleText } = await generateContentWithFallback(ai, {
          contents: [
            {
              role: 'user',
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
        const cleanTitle = titleText?.trim().replace(/^["']|["']$/g, '');
        if (cleanTitle && cleanTitle.length > 0 && cleanTitle.length < 60) {
          suggestedTitle = cleanTitle;
        }
      } catch (tErr) {
        console.warn('Title generation skipped:', tErr);
      }
    }

    return res.status(200).json({
      text: responseText,
      suggestedTitle,
      mode: mode || 'reflect',
      modelUsed,
    });
  } catch (error: any) {
    console.error('Error in Vercel /api/gemini/reflect:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process reflection with Gemini AI.',
    });
  }
}
