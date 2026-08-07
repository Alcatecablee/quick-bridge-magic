export interface CloudflareTurnServers {
  urls: string[];
  username: string;
  credential: string;
}

export async function fetchTurnCredentials(): Promise<CloudflareTurnServers | null> {
  try {
    const res = await fetch("/api/turn-credentials");
    if (!res.ok) return null;
    const data = (await res.json()) as CloudflareTurnServers;
    if (!data?.urls?.length) return null;
    return data;
  } catch {
    return null;
  }
}
