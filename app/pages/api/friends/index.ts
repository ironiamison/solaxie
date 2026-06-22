import type { NextApiRequest, NextApiResponse } from "next";
import { followWallet, getFollowers, getFollowing, unfollowWallet } from "@/lib/friends-store";
import { getPlayer, listPlayers } from "@/lib/players-store";
import { avatarForPlayer } from "@/lib/public-player";

const ONLINE_MS = 5 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const wallet = typeof req.query.wallet === "string" ? req.query.wallet : "";
    if (!wallet) return res.status(400).json({ error: "wallet required" });
    const following = await getFollowing(wallet);
    const followers = await getFollowers(wallet);
    if (req.query.detail !== "1") {
      return res.status(200).json({ following, followers });
    }
    const players = await listPlayers();
    const now = Date.now();
    const friends = following.map((w) => {
      const p = players.find((x) => x.wallet === w) ?? null;
      return {
        wallet: w,
        name: p?.name ?? `${w.slice(0, 4)}…${w.slice(-4)}`,
        trophies: p?.trophies ?? 0,
        avatar: p ? avatarForPlayer(p) : "/avatar-axolotl.png",
        league: p?.league ?? "—",
        online: p ? now - p.updatedAt < ONLINE_MS : false,
        following: true,
      };
    });
    return res.status(200).json({ following, followers, friends });
  }

  if (req.method === "POST") {
    const { wallet, target, action } = req.body as { wallet?: string; target?: string; action?: string };
    if (!wallet || !target) return res.status(400).json({ error: "wallet and target required" });
    const following =
      action === "unfollow" ? await unfollowWallet(wallet, target) : await followWallet(wallet, target);
    return res.status(200).json({ following });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method not allowed" });
}
