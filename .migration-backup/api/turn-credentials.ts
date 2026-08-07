interface VercelRequest {
  method?: string;
}

interface VercelResponse {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
}

export interface CloudflareTurnServers {
  urls: string[];
  username: string;
  credential: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const tokenId = process.env.CF_TURN_TOKEN_ID;
  const apiToken = process.env.CF_TURN_API_TOKEN;

  if (!tokenId || !apiToken) {
    return res.status(404).json({ error: "TURN not configured" });
  }

  try {
    const cfRes = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${tokenId}/credentials/generate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: 86400 }),
      },
    );

    if (!cfRes.ok) {
      return res.status(502).json({ error: "Cloudflare TURN error" });
    }

    const data = (await cfRes.json()) as { iceServers: CloudflareTurnServers };
    const servers = data.iceServers;
    if (!servers) {
      return res.status(502).json({ error: "Unexpected TURN response" });
    }

    return res.status(200).json(servers);
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
}
