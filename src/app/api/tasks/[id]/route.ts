import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { logAudit, requireAuth } from "@/lib/auth";
import { taskSchema } from "@/lib/validation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("tasks:read");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const db = getDb();
  const comments = db
    .prepare(
      `SELECT c.*, u.name as author_name
       FROM task_comments c JOIN users u ON u.id = c.user_id
       WHERE c.task_id = ? AND c.org_id = ? ORDER BY c.created_at ASC`
    )
    .all(id, auth.user.orgId);
  return NextResponse.json({ comments });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("tasks:write");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();

  if (body.comment) {
    const db = getDb();
    db.prepare(
      `INSERT INTO task_comments (id, org_id, task_id, user_id, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      `tc_${crypto.randomUUID()}`,
      auth.user.orgId,
      id,
      auth.user.id,
      String(body.comment),
      new Date().toISOString()
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = taskSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid task update" }, { status: 400 });
  }

  const db = getDb();
  const d = parsed.data;
  db.prepare(
    `UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      due_date = COALESCE(?, due_date),
      subtasks_json = COALESCE(?, subtasks_json),
      updated_at = ?
     WHERE id = ? AND org_id = ?`
  ).run(
    d.title ?? null,
    d.description ?? null,
    d.status ?? null,
    d.priority ?? null,
    d.dueDate ?? null,
    d.subtasks ? JSON.stringify(d.subtasks) : null,
    new Date().toISOString(),
    id,
    auth.user.orgId
  );

  logAudit({
    orgId: auth.user.orgId,
    userId: auth.user.id,
    action: "task.updated",
    entityType: "task",
    entityId: id,
  });

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  return NextResponse.json({ task });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("tasks:write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM tasks WHERE id = ? AND org_id = ?").run(id, auth.user.orgId);
  return NextResponse.json({ ok: true });
}
