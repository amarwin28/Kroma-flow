import { backup } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logAudit, requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth("settings:read");
  if ("error" in auth) return auth.error;

  const db = getDb();
  const logs = db
    .prepare(
      `SELECT a.*, u.name as actor_name
       FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
       WHERE a.org_id = ? ORDER BY a.created_at DESC LIMIT 50`
    )
    .all(auth.user.orgId);

  return NextResponse.json({ logs });
}

export async function POST() {
  const auth = await requireAuth("settings:write");
  if ("error" in auth) return auth.error;

  const { backupDir } = getEnv();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(backupDir, `kroma-flow-${stamp}.db`);
  const db = getDb();
  await backup(db, target);

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "database.backup_created",
    entityType: "system",
    details: { file: path.basename(target) },
  });

  return NextResponse.json({ ok: true, file: path.basename(target) });
}
