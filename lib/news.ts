export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  source: string;
}

/** Always fetch real headlines first — Gemini only ranks/summarizes these, never invents news. */
export async function fetchNews(keywords: string[]): Promise<NewsArticle[]> {
  const query = keywords.length ? keywords.join(" OR ") : "technology";
  const params = new URLSearchParams({
    q: query,
    language: "en",
    sortBy: "publishedAt",
    pageSize: "20",
    apiKey: process.env.NEWS_API_KEY!,
  });

  const res = await fetch(`https://newsapi.org/v2/everything?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`NewsAPI error: ${res.status}`);
  }

  const data = await res.json();
  return (data.articles ?? []).map(
    (article: { title: string; description: string | null; url: string; source?: { name?: string } }) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source?.name ?? "Unknown",
    })
  );
}
