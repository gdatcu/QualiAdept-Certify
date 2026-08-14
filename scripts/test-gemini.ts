import 'dotenv/config';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const TEST_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-001',
  'gemini-pro',
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
      break;
    } catch (e: any) {
      console.error(`FAILED "${m}":`, e?.message || e);
    }
  }
}

main();
