import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendDiscordTriumphNotification } from '@/lib/webhook';

describe('sendDiscordTriumphNotification Unit Tests', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('skips webhook request if DISCORD_WEBHOOK_URL is not set', async () => {
    delete process.env.DISCORD_WEBHOOK_URL;
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;

    await sendDiscordTriumphNotification({
      studentName: 'Alex',
      moduleNum: 1,
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends structured Discord embed notification when webhook URL is set', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    globalThis.fetch = fetchSpy;

    await sendDiscordTriumphNotification({
      studentName: 'George',
      userId: 'user-123',
      moduleNum: 2,
      assignmentTitle: 'Task Tracker HTML',
      validationType: 'STATIC',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('handles fetch network errors silently without crashing', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(
      sendDiscordTriumphNotification({
        studentName: 'George',
        moduleNum: 3,
      })
    ).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
  });
});
