import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should handle chat completion request', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-3.5-turbo',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('choices');
  });

  test('should handle rate limiting', async ({ request }) => {
    // Make multiple requests in quick succession
    const promises = Array(10)
      .fill(null)
      .map(() =>
        request.post('/api/chat', {
          data: {
            messages: [{ role: 'user', content: 'Test' }],
            model: 'gpt-3.5-turbo',
          },
        }),
      );

    const responses = await Promise.all(promises);
    const rateLimited = responses.some((r) => r.status() === 429);
    expect(rateLimited).toBeTruthy();
  });

  test('should validate input', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [], // Invalid - empty messages array
        model: 'invalid-model',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});
