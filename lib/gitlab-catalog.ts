export type GitLabProject = {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  description?: string | null;
};

/**
 * Lightweight helper to fetch GitLab group projects.
 * This is MVP-ready: it fetches public data from gitlab.com or from a private group when a token is provided.
 */
export async function loadGitLabCatalog(groupPath: string, token?: string): Promise<GitLabProject[]> {
  const base = "https://gitlab.com/api/v4";
  const url = `${base}/groups/${encodeURIComponent(groupPath)}/projects?per_page=100&order_by=name`;
  const headers: Record<string, string> = {};
  if (token) headers["PRIVATE-TOKEN"] = token;
  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    throw new Error(`GitLab catalog fetch failed: ${resp.status} ${resp.statusText}`);
  }
  const data = (await resp.json()) as GitLabProject[];
  return data || [];
}
