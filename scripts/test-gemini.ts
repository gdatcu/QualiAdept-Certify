import 'dotenv/config';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const TEST_MODELS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
];

const Schema = z.object({
  feedback: z.string(),
  codeQuality: z.enum(['Excellent', 'Good', 'Needs Improvement']),
});

async function main() {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  console.log('Gemini API key present:', !!apiKey, 'Value length:', apiKey?.length);

  for (const m of TEST_MODELS) {
    try {
      console.log(`Testing model: "${m}"...`);
      const { object } = await generateObject({
        model: google(m),
        schema: Schema,
        prompt: 'Review this code: page.goto("https://example.com"); expect(page).toHaveTitle("Example");',
      });
      console.log(`>>> SUCCESS with "${m}":`, object);
    } catch (e: any) {
      console.error(`FAILED "${m}":`, e?.message || e);
    }
  }
}

main();
