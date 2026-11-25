import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth("team:read");
  if ("error" in auth) return auth.error;

  const db = getDb();
  const invitations = db
    .prepare("SELECT * FROM invitations WHERE org_id = ? ORDER BY created_at DESC")
    .all(auth.user.orgId);

  return NextResponse.json({ invitations });
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "manager", "sales", "member", "client"]).default("member"),
});

export async function POST(req: Request) {
  const auth = await requireAuth("team:write");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email and role are required" }, { status: 400 });
  }

  const db = getDb();
  const id = `inv_${crypto.randomUUID()}`;
  const token = `kfx_${crypto.randomBytes(16).toString("hex")}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO invitations (id, org_id, email, role, token, invited_by, status, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  ).run(id, auth.user.orgId, parsed.data.email.toLowerCase(), parsed.data.role, token, auth.user.id, expiresAt, now.toISOString());

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "team.invited",
    entityType: "invitation",
    entityId: id,
    details: { email: parsed.data.email, role: parsed.data.role },
  });

  return NextResponse.json({ invitation: { id, email: parsed.data.email, role: parsed.data.role, token, expiresAt } }, { status: 201 });
}
