import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const db = getDb();
  const notifications = db
    .prepare(
      `SELECT * FROM notifications WHERE org_id = ? AND (user_id = ? OR user_id IS NULL)
       ORDER BY created_at DESC LIMIT 20`
    )
    .all(auth.user.orgId, auth.user.id);

  return NextResponse.json({ notifications });
}

export async function PATCH() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const db = getDb();
  db.prepare("UPDATE notifications SET read = 1 WHERE org_id = ? AND user_id = ?").run(
    auth.user.orgId,
    auth.user.id
  );
  return NextResponse.json({ ok: true });
}
