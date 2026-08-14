import 'dotenv/config';
import { generateText, generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const Schema = z.object({
  feedback: z.string(),
  codeQuality: z.enum(['Excellent', 'Good', 'Needs Improvement']),
});

async function main() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  console.log('Testing generateText with JSON prompt...');
  const startText = Date.now();
  const textRes = await generateText({
    model: google('gemini-flash-latest'),
    prompt: `Review this code: page.goto("https://example.com"); expect(page).toHaveTitle("Example");
Return JSON: {"feedback": "2 sentences", "codeQuality": "Excellent" | "Good" | "Needs Improvement"}`,
  });
  console.log(`>>> generateText finished in ${Date.now() - startText}ms:`, textRes.text);

  console.log('Testing generateObject...');
  const startObj = Date.now();
  const objRes = await generateObject({
    model: google('gemini-flash-latest'),
    schema: Schema,
    prompt: 'Review this code: page.goto("https://example.com"); expect(page).toHaveTitle("Example");',
  });
  console.log(`>>> generateObject finished in ${Date.now() - startObj}ms:`, objRes.object);
}

main();
