import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth("team:read");
  if ("error" in auth) return auth.error;

  const db = getDb();
  const members = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.job_title, u.phone, u.status, u.created_at,
        (SELECT COUNT(*) FROM tasks t WHERE t.assignee_id = u.id AND t.status != 'Done') as open_tasks,
        (SELECT COUNT(*) FROM projects p WHERE p.manager_id = u.id AND p.status != 'Completed') as managed_projects
       FROM users u
       WHERE u.org_id = ?
       ORDER BY u.created_at ASC`
    )
    .all(auth.user.orgId);

  const invitations = db
    .prepare("SELECT * FROM invitations WHERE org_id = ? ORDER BY created_at DESC")
    .all(auth.user.orgId);

  return NextResponse.json({ members, invitations });
}

const roleUpdateSchema = z.object({
  userId: z.string(),
  role: z.enum(["owner", "admin", "manager", "sales", "member", "client"]),
});

export async function PATCH(req: Request) {
  const auth = await requireAuth("team:write");
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = roleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role update" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("UPDATE users SET role = ? WHERE id = ? AND org_id = ?").run(
    parsed.data.role,
    parsed.data.userId,
    auth.user.orgId
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "team.role_updated",
    entityType: "user",
    entityId: parsed.data.userId,
    details: { role: parsed.data.role },
  });

  return NextResponse.json({ ok: true });
}
