import type { NextApiRequest, NextApiResponse } from "next";
import { getCloudSave, upsertCloudSave, type CloudSave } from "@/lib/cloud-save-store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const wallet = typeof req.query.wallet === "string" ? req.query.wallet : "";
    if (!wallet) return res.status(400).json({ error: "wallet required" });
    const save = await getCloudSave(wallet);
    return res.status(200).json({ save });
  }

  if (req.method === "POST") {
    const body = req.body as CloudSave;
    if (!body?.wallet || typeof body.wallet !== "string") {
      return res.status(400).json({ error: "wallet required" });
    }
    if (!body.profile?.name?.trim()) {
      return res.status(400).json({ error: "profile name required" });
    }
    await upsertCloudSave({ ...body, updatedAt: Date.now() });
    return res.status(201).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method not allowed" });
}
