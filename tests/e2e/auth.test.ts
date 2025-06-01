import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should handle invalid API key', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'Test' }],
        model: 'gpt-3.5-turbo',
      },
      headers: {
        Authorization: 'Bearer invalid-key',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should handle missing API key', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'Test' }],
        model: 'gpt-3.5-turbo',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should validate API key format', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'Test' }],
        model: 'gpt-3.5-turbo',
      },
      headers: {
        Authorization: 'invalid-format',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});
