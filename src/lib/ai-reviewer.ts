import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export interface AiReviewResult {
  aiFeedback: string;
  codeQuality: 'Excellent' | 'Good' | 'Needs Improvement';
}

const FALLBACK_REVIEW: AiReviewResult = {
  aiFeedback: 'Feedback-ul AI este temporar indisponibil. Totuși, codul tău a fost validat cu succes de sistem!',
  codeQuality: 'Good',
};

/**
 * Active production models supported by Google Gemini API
 * Primary: gemini-flash-latest (Ultra-fast, low latency)
 * Fallbacks: gemini-3.5-flash, gemini-3.6-flash, gemini-3.7-flash
 */
const CANDIDATE_MODELS = [
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
];

/**
 * Generates an automated AI Code Review using verified active Google Gemini models via Vercel AI SDK.
 * Uses generateText with fast JSON output and defensive multi-model fallback handling.
 */
export async function generateAiCodeReview(codePayload: string): Promise<AiReviewResult> {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!apiKey || !apiKey.trim() || apiKey.length < 20 || !codePayload || !codePayload.trim()) {
    return FALLBACK_REVIEW;
  }

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const { text } = await generateText({
        model: google(modelName),
        system:
          "You are a Senior QA Automation Engineer reviewing a student's Playwright/JavaScript code. Be concise, direct, and evaluate ONLY the code style, stability of selectors, and basic clean code principles.",
        prompt: `Student Code Submission:\n\`\`\`html\n${codePayload.slice(0, 2000)}\n\`\`\`\n\nReturn strictly raw JSON (no markdown formatting, no code block backticks) with keys:\n{\n  "feedback": "Maximum 2-sentence constructive feedback",\n  "codeQuality": "Excellent" | "Good" | "Needs Improvement"\n}`,
        abortSignal: AbortSignal.timeout(8000),
      });

      const cleanedText = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedText);

      if (parsed && typeof parsed.feedback === 'string') {
        const quality = ['Excellent', 'Good', 'Needs Improvement'].includes(parsed.codeQuality)
          ? parsed.codeQuality
          : 'Good';

        return {
          aiFeedback: parsed.feedback.trim(),
          codeQuality: quality,
        };
      }
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      console.warn(`Gemini model "${modelName}" failed: ${errMsg}`);

      if (errMsg.includes('API key') || errMsg.includes('API_KEY_INVALID')) {
        break;
      }
    }
  }

  return FALLBACK_REVIEW;
}
