import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth("chat:read");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId") || "";
  const q = searchParams.get("q") || "";
  const db = getDb();

  const channels = db
    .prepare("SELECT * FROM channels WHERE org_id = ? ORDER BY created_at ASC")
    .all(auth.user.orgId) as Array<{ id: string }>;

  const activeChannelId = channelId || channels[0]?.id || "";
  let messages: unknown[] = [];

  if (activeChannelId) {
    let sql = `SELECT m.*, u.name as sender_name, u.role as sender_role
               FROM messages m JOIN users u ON u.id = m.sender_id
               WHERE m.org_id = ? AND m.channel_id = ?`;
    const params: string[] = [auth.user.orgId, activeChannelId];
    if (q) {
      sql += " AND m.content LIKE ?";
      params.push(`%${q}%`);
    }
    sql += " ORDER BY m.created_at ASC LIMIT 100";
    messages = db.prepare(sql).all(...params);
  }

  return NextResponse.json({ channels, activeChannelId, messages });
}

const msgSchema = z.object({
  channelId: z.string().optional(),
  newChannelName: z.string().optional(),
  content: z.string().min(1).optional(),
  attachmentName: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAuth("chat:write");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = msgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const db = getDb();
  const now = new Date().toISOString();

  if (parsed.data.newChannelName) {
    const chId = `ch_${crypto.randomUUID()}`;
    db.prepare(
      `INSERT INTO channels (id, org_id, name, type, created_at) VALUES (?, ?, ?, 'team', ?)`
    ).run(chId, auth.user.orgId, parsed.data.newChannelName.toLowerCase().replace(/\s+/g, "-"), now);
    return NextResponse.json({ channelId: chId }, { status: 201 });
  }

  if (!parsed.data.channelId || !parsed.data.content) {
    return NextResponse.json({ error: "Channel and message content required" }, { status: 400 });
  }

  const msgId = `msg_${crypto.randomUUID()}`;
  db.prepare(
    `INSERT INTO messages (id, org_id, channel_id, sender_id, content, attachment_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    msgId,
    auth.user.orgId,
    parsed.data.channelId,
    auth.user.id,
    parsed.data.content,
    parsed.data.attachmentName || "",
    now
  );

  return NextResponse.json({ id: msgId }, { status: 201 });
}
