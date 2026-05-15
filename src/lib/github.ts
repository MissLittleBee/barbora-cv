export type Repo = {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
  topics: string[];
};

const API = 'https://api.github.com/users/MissLittleBee/repos?per_page=100';

export async function fetchPortfolioRepos(): Promise<Repo[]> {
  const token = import.meta.env.GH_TOKEN ?? process.env.GH_TOKEN;
  const res = await fetch(API, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const all = (await res.json()) as Repo[];
  return all
    .filter(r => r.topics?.includes('portfolio'))
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
}
