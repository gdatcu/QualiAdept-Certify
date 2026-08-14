import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateAiCodeReview } from '@/lib/ai-reviewer';
import * as aiModule from 'ai';

vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn((model: string) => model),
}));

describe('generateAiCodeReview Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns fallback review if no API key is provided', async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    const result = await generateAiCodeReview('<main><h1>Test</h1></main>');
    expect(result.codeQuality).toBe('Good');
    expect(result.aiFeedback).toContain('temporar indisponibil');
  });

  it('returns fallback review if code payload is empty', async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'AIzaSyTestApiKeyPlaceholderLongEnough12345';

    const result = await generateAiCodeReview('   ');
    expect(result.codeQuality).toBe('Good');
    expect(result.aiFeedback).toContain('temporar indisponibil');
  });

  it('returns AI feedback object when Gemini API succeeds', async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'AIzaSyTestApiKeyPlaceholderLongEnough12345';

    vi.spyOn(aiModule, 'generateText').mockResolvedValueOnce({
      text: JSON.stringify({
        feedback: 'Great use of semantic main tag and clean element locators.',
        codeQuality: 'Excellent',
      }),
    } as any);

    const result = await generateAiCodeReview('<main><button id="submit">Click</button></main>');
    expect(result.codeQuality).toBe('Excellent');
    expect(result.aiFeedback).toBe('Great use of semantic main tag and clean element locators.');
  });

  it('handles model API failures gracefully and returns fallback', async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'AIzaSyTestApiKeyPlaceholderLongEnough12345';

    vi.spyOn(aiModule, 'generateText').mockRejectedValue(new Error('Invalid API key provided'));

    const result = await generateAiCodeReview('<main><h1>Test</h1></main>');
    expect(result.codeQuality).toBe('Good');
    expect(result.aiFeedback).toContain('temporar indisponibil');
  });
});
