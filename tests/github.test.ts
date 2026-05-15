import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPortfolioRepos } from '~/lib/github';

const fakeRepos = [
  { name: 'a', description: null, html_url: 'u1', stargazers_count: 5, language: 'Python', updated_at: '2026-01-01T00:00:00Z', topics: ['portfolio'] },
  { name: 'b', description: 'x', html_url: 'u2', stargazers_count: 1, language: 'JS',     updated_at: '2026-05-01T00:00:00Z', topics: ['portfolio'] },
  { name: 'c', description: 'y', html_url: 'u3', stargazers_count: 9, language: 'Go',     updated_at: '2026-03-01T00:00:00Z', topics: ['other'] },
];

describe('fetchPortfolioRepos', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => fakeRepos,
    })));
    vi.stubEnv('GH_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('returns only repos tagged "portfolio"', async () => {
    const result = await fetchPortfolioRepos();
    expect(result.map(r => r.name)).toEqual(['b', 'a']);
  });

  it('sorts by updated_at descending', async () => {
    const result = await fetchPortfolioRepos();
    expect(result[0].updated_at > result[1].updated_at).toBe(true);
  });

  it('throws on non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })));
    await expect(fetchPortfolioRepos()).rejects.toThrow(/500/);
  });
});
