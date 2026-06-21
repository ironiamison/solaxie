import type { NextApiRequest, NextApiResponse } from "next";
import { appendGlobalFeed, getGlobalFeed } from "@/lib/feed-store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const entries = await getGlobalFeed();
    return res.status(200).json({ entries });
  }

  if (req.method === "POST") {
    const { who, what, color } = req.body ?? {};
    if (!who || !what || typeof who !== "string" || typeof what !== "string") {
      return res.status(400).json({ error: "who and what required" });
    }
    const item = await appendGlobalFeed({
      who: who.trim().slice(0, 24),
      what: what.trim().slice(0, 140),
      color: typeof color === "string" ? color.slice(0, 24) : "#a463ff",
    });
    return res.status(201).json({ ok: true, entry: item });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method not allowed" });
}
