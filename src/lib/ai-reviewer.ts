import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export interface AiReviewResult {
  aiFeedback: string;
  codeQuality: 'Excellent' | 'Good' | 'Needs Improvement';
}

const FALLBACK_REVIEW: AiReviewResult = {
  aiFeedback: 'Feedback-ul AI este temporar indisponibil. Totuși, codul tău a fost validat cu succes de sistem!',
  codeQuality: 'Good',
};

const ReviewSchema = z.object({
  feedback: z
    .string()
    .describe(
      "Maximum 2-sentence constructive feedback on the student's code quality, selector choices, or clean code practices."
    ),
  codeQuality: z.enum(['Excellent', 'Good', 'Needs Improvement']),
});

/**
 * Models supported by your Google Gemini API key
 */
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-pro-latest',
];

/**
 * Generates an automated AI Code Review using verified active Google Gemini models via Vercel AI SDK.
 * Includes defensive multi-model fallback handling to ensure primary submission validation never fails.
 */
export async function generateAiCodeReview(codePayload: string): Promise<AiReviewResult> {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!apiKey || !apiKey.trim() || !codePayload || !codePayload.trim()) {
    return FALLBACK_REVIEW;
  }

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const { object } = await generateObject({
        model: google(modelName),
        schema: ReviewSchema,
        system:
          "You are a Senior QA Automation Engineer reviewing a student's Playwright/JavaScript code. Be concise, direct, and evaluate ONLY the code style, stability of selectors, and basic clean code principles.",
        prompt: `Student Code Submission:\n\`\`\`html\n${codePayload}\n\`\`\``,
      });

      if (object && object.feedback) {
        return {
          aiFeedback: object.feedback.trim(),
          codeQuality: object.codeQuality || 'Good',
        };
      }
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      console.warn(`Gemini model "${modelName}" failed: ${errMsg}`);
    }
  }

  return FALLBACK_REVIEW;
}
